import { act, fireEvent, fireEventAsync, renderAsync } from '@testing-library/react-native';
import { PanResponder } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StudiesScreen } from '../src/StudiesScreen';
import { TabSwipeProvider } from '../src/tab-swipe';
import { HomeScreen } from '../src/HomeScreen';

afterEach(()=>jest.restoreAllMocks());
async function setup() {
  const spy=jest.spyOn(PanResponder,'create');
  const navigate=jest.fn();
  const get=jest.fn().mockImplementation((path:string)=>Promise.resolve(path==='/family-members'?{items:[{uuid:'family-test',name:'Familiar'}]}:{items:[],nextCursor:null}));
  const screen=await renderAsync(<TabSwipeProvider tabs={['home','studies','family','account']} currentTab="studies" width={390} navigate={navigate}><StudiesScreen client={{get}} pdf={{open:jest.fn()}} advanced familyScope/></TabSwipeProvider>);
  const config=spy.mock.calls[0][0];
  const start=()=>config.onStartShouldSetPanResponderCapture?.({nativeEvent:{pageX:150,touches:[{}]}} as never,{} as never);
  const move=()=>config.onMoveShouldSetPanResponderCapture?.({} as never,{dx:-100,dy:0,numberActiveTouches:1} as never);
  const release=()=>config.onPanResponderRelease?.({} as never,{dx:-100,dy:0} as never);
  return {screen,navigate,start,move,release,get};
}
test.each(['Mi historial','Todos los pacientes','Seleccionar paciente','Filtros'])('real patient/filter control %s cannot initiate a tab swipe',async name=>{
  const {screen,navigate,start,move,release}=await setup();
  start(); fireEvent(screen.getByRole('button',{name}),'touchStart',{nativeEvent:{pageX:150}});
  expect(move()).toBe(false); release(); expect(navigate).not.toHaveBeenCalled();
});
test('patient modal owns native safe area and blocks background swipe until closed',async()=>{
  const {screen,navigate,start,move,release,get}=await setup();
  await fireEventAsync.press(screen.getByRole('button',{name:'Seleccionar paciente'}));
  expect(screen.UNSAFE_getAllByType(SafeAreaProvider)).toHaveLength(1);
  start(); expect(move()).toBe(false); release(); expect(navigate).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole('button',{name:'Paciente: Familiar'}));
  expect(get).toHaveBeenCalledWith('/studies?sort=study-date-desc&scope=family&familyUuid=family-test');
  act(()=>{start();expect(move()).toBe(true);release();});
  expect(navigate).toHaveBeenCalledWith('family');
});

test('Home Ver todos preserves its action without initiating a tab swipe',async()=>{
  const spy=jest.spyOn(PanResponder,'create');
  const navigate=jest.fn(); const onViewAll=jest.fn();
  const get=jest.fn().mockResolvedValue({propiosTotal:0,recientes:[]});
  const screen=await renderAsync(<TabSwipeProvider tabs={['home','studies','family','account']} currentTab="home" width={390} navigate={navigate}><HomeScreen name={null} client={{get}} pdf={{open:jest.fn()}} onViewAll={onViewAll}/></TabSwipeProvider>);
  const config=spy.mock.calls[0][0];
  config.onStartShouldSetPanResponderCapture?.({nativeEvent:{pageX:150,touches:[{}]}} as never,{} as never);
  const button=screen.getByRole('button',{name:'Ver todos'});
  fireEvent(button,'touchStart',{nativeEvent:{pageX:150}});
  expect(config.onMoveShouldSetPanResponderCapture?.({} as never,{dx:-100,dy:0,numberActiveTouches:1} as never)).toBe(false);
  config.onPanResponderRelease?.({} as never,{dx:-100,dy:0} as never);
  expect(navigate).not.toHaveBeenCalled();
  await fireEventAsync.press(button); expect(onViewAll).toHaveBeenCalledTimes(1);
});
