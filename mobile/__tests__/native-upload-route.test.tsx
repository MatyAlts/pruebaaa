import { renderAsync } from "@testing-library/react-native";
import UploadRoute from "../app/upload";
import { useSession } from "../src/session-provider";
import { UploadFlow } from "../src/UploadEntry";
const mockBack=jest.fn();
const mockParams=jest.fn(()=>({}));
jest.mock("expo-router",()=>{const {Text}=jest.requireActual("react-native");return {useLocalSearchParams:()=>mockParams(),useRouter:()=>({back:mockBack}),Redirect:()=> <Text>login</Text>};});
jest.mock("expo-router/react-navigation",()=>({usePreventRemove:jest.fn(),useNavigation:()=>({dispatch:jest.fn()})}));
jest.mock("../src/session-provider",()=>({useSession:jest.fn()}));
jest.mock("../src/UploadEntry",()=>({UploadFlow:jest.fn(()=>null)}));
beforeEach(()=>{jest.clearAllMocks();mockParams.mockReturnValue({});});
test("native upload card reuses the real flow in embedded mode",async()=>{
 jest.mocked(useSession).mockReturnValue({state:{user:{id:"owner"},busy:false},client:{get:jest.fn()},uploadFiles:{},capabilitiesReady:true,capabilities:{studiesUpload:true},invalidateHistory:jest.fn()} as never);
 const screen=await renderAsync(<UploadRoute/>);
 expect(screen.UNSAFE_getByType(UploadFlow).props.embedded).toBe(true);
 expect(screen.UNSAFE_getByType(UploadFlow).props.onNavigationState).toEqual(expect.any(Function));
});
test("signed-out upload cannot mount a private draft even with a retained client",async()=>{
 jest.mocked(useSession).mockReturnValue({state:{user:null,busy:false},client:{get:jest.fn()},uploadFiles:{},capabilitiesReady:true,capabilities:{studiesUpload:true}} as never);
 const screen=await renderAsync(<UploadRoute/>);
 expect(screen.getByText("login")).toBeTruthy();
 expect(UploadFlow).not.toHaveBeenCalled();
});

test("family upload uses canonical familyMember DTO and locks that patient",async()=>{
 mockParams.mockReturnValue({familyUuid:"folder"} as never);
 const get=jest.fn().mockResolvedValue({familyMember:{uuid:"folder",name:"Paciente"}});
 jest.mocked(useSession).mockReturnValue({state:{user:{id:"owner"},busy:false},client:{get},uploadFiles:{},capabilitiesReady:true,capabilities:{studiesUpload:true,familyRead:true},invalidateHistory:jest.fn()} as never);
 const screen=await renderAsync(<UploadRoute/>);
 const {waitFor}=jest.requireActual("@testing-library/react-native");
 await waitFor(()=>expect(screen.UNSAFE_getByType(UploadFlow).props.initialFamily).toMatchObject({uuid:"folder",name:"Paciente"}));
 expect(get).toHaveBeenCalledWith("/family-members/folder");
});
