import { act, renderAsync, fireEventAsync } from '@testing-library/react-native';
import DetailRoute from '../app/study/[id]';
import { useSession } from '../src/session-provider';
import { StudyDetail } from '../src/StudyDetail';
import * as detailModule from '../src/StudyDetail';
import { usePreventRemove } from 'expo-router/react-navigation';
const mockParams = jest.fn(()=>({id:'study-test'}));
const mockRedirect = jest.fn();
jest.mock('expo-router',()=>{
  const { Text } = jest.requireActual('react-native');
  return {useLocalSearchParams:()=>mockParams(),Redirect:({href}:{href:string})=> { mockRedirect(href); return <Text>login</Text>; }};
});
jest.mock('../src/session-provider',()=>({useSession:jest.fn()}));
jest.mock('expo-router/react-navigation',()=>({usePreventRemove:jest.fn()}));
beforeEach(()=>mockParams.mockReturnValue({id:'study-test'}));
afterEach(()=>jest.restoreAllMocks());

test('native detail route loads real owned study and opens its existing PDF adapter', async () => {
  const get=jest.fn().mockResolvedValue({study:{id:'study-test',title:'Control',date:'10-09-2026',files:[{id:'file-test',name:'report.pdf',mimeType:'application/pdf'}]}});
  const open=jest.fn().mockResolvedValue(undefined);
  jest.mocked(useSession).mockReturnValue({client:{get} as never,pdf:{open} as never,capabilities:{},state:{user:{id:'test'},busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  await screen.findByText('Control');
  expect(get).toHaveBeenCalledWith('/studies/study-test');
  expect(screen.UNSAFE_getByType(StudyDetail).props.embedded).toBe(true);
  expect(screen.queryByRole('button',{name:'Volver a estudios'})).toBeNull();
  await fireEventAsync.press(screen.getByRole('button',{name:'Abrir report.pdf'}));
  expect(open).toHaveBeenCalledWith('study-test','file-test');
});

test('native detail read error retries without changing the study identifier', async () => {
  const get=jest.fn().mockRejectedValueOnce(new Error('Sin red')).mockResolvedValueOnce({study:{id:'study-test',title:'Control',date:'10-09-2026'}});
  jest.mocked(useSession).mockReturnValue({client:{get} as never,pdf:{open:jest.fn()} as never,capabilities:{},state:{user:{id:'test'},busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  await screen.findByText('Sin red');
  await fireEventAsync.press(screen.getByRole('button',{name:'Reintentar estudio'}));
  await screen.findByText('Control');
  expect(get.mock.calls).toEqual([['/studies/study-test'],['/studies/study-test']]);
});

test('unauthenticated native detail route reuses login gate without reading clinical data', async () => {
  const get=jest.fn();
  jest.mocked(useSession).mockReturnValue({client:{get} as never,pdf:{} as never,capabilities:{},state:{user:null,busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  expect(screen.getByText('login')).toBeTruthy();
  expect(mockRedirect).toHaveBeenLastCalledWith('/');
  expect(get).not.toHaveBeenCalled();
});

test('late detail response is discarded when the session logs out with the same client', async () => {
  let finish!: (value: unknown)=>void;
  const get=jest.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const client={get};
  jest.mocked(useSession).mockReturnValue({client,pdf:{} as never,capabilities:{},state:{user:{id:'first'},busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  jest.mocked(useSession).mockReturnValue({client,pdf:{} as never,capabilities:{},state:{user:null,busy:false}} as never);
  await screen.rerenderAsync(<DetailRoute/>);
  await act(async()=>finish({study:{id:'study-test',title:'Previous clinical data',date:'10-09-2026'}}));
  expect(screen.getByText('login')).toBeTruthy();
  expect(screen.queryByText('Previous clinical data')).toBeNull();
});

test('changing user with the same client replaces owned detail and rejects the first response', async () => {
  let finish!: (value: unknown)=>void;
  const get=jest.fn().mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}))
    .mockResolvedValueOnce({study:{id:'study-test',title:'Current session study',date:'10-09-2026'}});
  const client={get};
  const session=(id:string)=>({client,pdf:{} as never,capabilities:{},state:{user:{id},busy:false}} as never);
  jest.mocked(useSession).mockReturnValue(session('first'));
  const screen=await renderAsync(<DetailRoute/>);
  jest.mocked(useSession).mockReturnValue(session('second'));
  await screen.rerenderAsync(<DetailRoute/>);
  await act(async()=>finish({study:{id:'study-test',title:'Previous clinical data',date:'10-09-2026'}}));
  expect(screen.getByText('Current session study')).toBeTruthy();
  expect(screen.queryByText('Previous clinical data')).toBeNull();
  expect(get).toHaveBeenCalledTimes(2);
});

test('changing route identifier never renders a cached prior study for the new route', async()=>{
  const get=jest.fn().mockResolvedValueOnce({study:{id:'study-test',title:'Previous',date:'10-09-2026'}})
    .mockImplementationOnce(()=>new Promise(()=>{}));
  jest.mocked(useSession).mockReturnValue({client:{get} as never,pdf:{} as never,capabilities:{},state:{user:{id:'test'},busy:false}} as never);
  const actual=detailModule.StudyDetail;
  const spy=jest.spyOn(detailModule,'StudyDetail').mockImplementation(props=>actual(props));
  const screen=await renderAsync(<DetailRoute/>);
  spy.mockClear();
  mockParams.mockReturnValue({id:'other-study'});
  await screen.rerenderAsync(<DetailRoute/>);
  expect(spy).not.toHaveBeenCalled();
  expect(screen.queryByText('Previous')).toBeNull();
});

test('native detail exposes deletion only with real capability and refreshes canonical history',async()=>{
  const get=jest.fn().mockResolvedValue({study:{id:'study-test',title:'Control',date:'10-09-2026'}});
  const write=jest.fn().mockImplementation((_path,_method,body)=>Promise.resolve({operationId:body.idempotencyKey,status:'committed'}));
  const invalidateHistory=jest.fn();
  jest.mocked(useSession).mockReturnValue({client:{get,write} as never,pdf:{} as never,capabilities:{studiesDelete:true},invalidateHistory,state:{user:{id:'test'},busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar estudio'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar definitivamente'}));
  expect(invalidateHistory).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Control')).toBeNull();
});
test('uncertain deletion prevents native back until reconciled without another DELETE',async()=>{
  const get=jest.fn().mockResolvedValue({study:{id:'study-test',title:'Control',date:'10-09-2026'}});
  const write=jest.fn().mockRejectedValue(new Error('Sin red'));
  jest.mocked(useSession).mockReturnValue({client:{get,write} as never,pdf:{} as never,capabilities:{studiesDelete:true},invalidateHistory:jest.fn(),state:{user:{id:'test'},busy:false}} as never);
  const screen=await renderAsync(<DetailRoute/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar estudio'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar definitivamente'}));
  expect(usePreventRemove).toHaveBeenLastCalledWith(true,expect.any(Function));
  expect(write).toHaveBeenCalledTimes(1);
});
