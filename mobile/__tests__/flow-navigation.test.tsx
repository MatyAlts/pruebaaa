import { renderAsync } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useFlowBackGuard } from '../src/flow-navigation';
const mockDispatch=jest.fn();
jest.mock('expo-router/react-navigation',()=>({usePreventRemove:jest.fn(),useNavigation:()=>({dispatch:mockDispatch})}));
function Probe({blocked=false,dirty=false,enabled=true,revision="",identity="owner",pendingAnalysis=false}:{pendingAnalysis?:boolean;blocked?:boolean;dirty?:boolean;enabled?:boolean;revision?:string;identity?:string}){useFlowBackGuard({blocked,dirty,revision,pendingAnalysis},enabled,identity);return null;}
beforeEach(()=>{jest.clearAllMocks();});
afterEach(()=>jest.restoreAllMocks());
test('an uncertain operation prevents native back without offering destructive discard',async()=>{
  const alert=jest.spyOn(Alert,'alert');
  await renderAsync(<Probe blocked dirty/>);
  const [blocked,callback]=jest.mocked(usePreventRemove).mock.calls.at(-1)!;
  expect(blocked).toBe(true); callback({data:{action:{type:'GO_BACK'}}});
  expect(alert).toHaveBeenCalledWith('Operación en curso',expect.any(String));
  expect(mockDispatch).not.toHaveBeenCalled();
});
test('dirty draft prompts cancellation or explicit discard before dispatching the original native action',async()=>{
  const alert=jest.spyOn(Alert,'alert');
  await renderAsync(<Probe dirty/>);
  const action={type:'GO_BACK'};
  jest.mocked(usePreventRemove).mock.calls.at(-1)![1]({data:{action}});
  const buttons=alert.mock.calls.at(-1)![2]!;
  expect(buttons.find(button=>button.style==='cancel')).toBeTruthy();
  buttons.find(button=>button.style==='destructive')!.onPress!();
  expect(mockDispatch).toHaveBeenCalledWith(action);
});
test('a draft locking after the confirmation opens cannot be discarded by a stale alert',async()=>{
  const alert=jest.spyOn(Alert,'alert');
  const screen=await renderAsync(<Probe dirty/>);
  jest.mocked(usePreventRemove).mock.calls.at(-1)![1]({data:{action:{type:'GO_BACK'}}});
  const confirm=alert.mock.calls.at(-1)![2]!.find(button=>button.style==='destructive')!.onPress!;
  await screen.rerenderAsync(<Probe dirty blocked/>);
  confirm(); expect(mockDispatch).not.toHaveBeenCalled();
});
test('pristine or logged-out flow allows native removal without a draft prompt',async()=>{
  const screen=await renderAsync(<Probe/>);
  expect(jest.mocked(usePreventRemove).mock.calls.at(-1)![0]).toBe(false);
  await screen.rerenderAsync(<Probe blocked dirty enabled={false}/>);
  expect(jest.mocked(usePreventRemove).mock.calls.at(-1)![0]).toBe(false);
});

test.each(["revision","identity"])("stale discard cannot authorize a changed %s",async(kind)=>{
 const alert=jest.spyOn(Alert,"alert");const screen=await renderAsync(<Probe dirty revision="first"/>);
 jest.mocked(usePreventRemove).mock.calls.at(-1)![1]({data:{action:{type:"GO_BACK"}}});
 const confirm=alert.mock.calls.at(-1)![2]!.find(button=>button.style==="destructive")!.onPress!;
 await screen.rerenderAsync(<Probe dirty revision={kind==="revision"?"second":"first"} identity={kind==="identity"?"new-owner":"owner"}/>);
 confirm();expect(mockDispatch).not.toHaveBeenCalled();
});

test("leaving a submitted analysis warns that paid work may continue without saving",async()=>{
 const alert=jest.spyOn(Alert,"alert");await renderAsync(<Probe dirty pendingAnalysis/>);
 jest.mocked(usePreventRemove).mock.calls.at(-1)![1]({data:{action:{type:"GO_BACK"}}});
 expect(alert).toHaveBeenLastCalledWith("Descartar cambios",expect.stringMatching(/an\u00e1lisis.*continuar.*cuota/i),expect.any(Array));
});

test("pending analysis still warns when its local draft has been cleared",async()=>{
 await renderAsync(<Probe pendingAnalysis/>);expect(jest.mocked(usePreventRemove).mock.calls.at(-1)![0]).toBe(true);
});
test("discard confirmation before a paid submission cannot authorize leaving that new operation",async()=>{
 const alert=jest.spyOn(Alert,"alert");const screen=await renderAsync(<Probe dirty/>);
 jest.mocked(usePreventRemove).mock.calls.at(-1)![1]({data:{action:{type:"GO_BACK"}}});
 const confirm=alert.mock.calls.at(-1)![2]!.find(button=>button.style==="destructive")!.onPress!;
 await screen.rerenderAsync(<Probe dirty pendingAnalysis/>);confirm();expect(mockDispatch).not.toHaveBeenCalled();
});
