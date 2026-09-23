import { renderAsync } from "@testing-library/react-native";
import FamilyRoute from "../app/family/[uuid]";
import FamilyFormRoute from "../app/family-form";
import { FamilyScreen } from "../src/FamilyScreen";
import { useSession } from "../src/session-provider";
const mockPush=jest.fn(); const mockBack=jest.fn();
const mockParams=jest.fn(()=>({uuid:"folder"}));
jest.mock("expo-router",()=>{const {Text}=jest.requireActual("react-native");return {useLocalSearchParams:()=>mockParams(),useRouter:()=>({push:mockPush,back:mockBack}),Redirect:()=> <Text>login</Text>};});
jest.mock("expo-router/react-navigation",()=>({usePreventRemove:jest.fn(),useNavigation:()=>({dispatch:jest.fn()})}));
jest.mock("../src/session-provider",()=>({useSession:jest.fn()}));
jest.mock("../src/FamilyScreen",()=>({FamilyScreen:jest.fn(()=>null)}));
beforeEach(()=>{jest.clearAllMocks();mockParams.mockReturnValue({uuid:"folder"});jest.mocked(useSession).mockReturnValue({state:{user:{id:"owner"},busy:false},client:{get:jest.fn()},pdf:{},capabilitiesReady:true,capabilities:{familyRead:true,familyWrite:true,familyDelete:true,studiesUpload:true},invalidateHistory:jest.fn()} as never);});
test("folder card opens nested study and locked-patient upload with ids only",async()=>{
 const screen=await renderAsync(<FamilyRoute/>);const props=screen.UNSAFE_getByType(FamilyScreen).props;
 expect(props.flowMode).toBe("folder"); expect(props.familyUuid).toBe("folder");
 props.onOpenStudy("study");expect(mockPush).toHaveBeenLastCalledWith({pathname:"/study/[id]",params:{id:"study"}});
 props.onUploadFamily("folder");expect(mockPush).toHaveBeenLastCalledWith({pathname:"/upload",params:{familyUuid:"folder"}});
});
test("create and edit cards reuse family form with native exit guard callback",async()=>{
 mockParams.mockReturnValue({} as never);let screen=await renderAsync(<FamilyFormRoute/>);
 expect(screen.UNSAFE_getByType(FamilyScreen).props.flowMode).toBe("create");
 expect(screen.UNSAFE_getByType(FamilyScreen).props.onNavigationState).toEqual(expect.any(Function));
 await screen.unmountAsync();mockParams.mockReturnValue({uuid:"folder"});screen=await renderAsync(<FamilyFormRoute/>);
 expect(screen.UNSAFE_getByType(FamilyScreen).props.flowMode).toBe("edit");
});
test("signed-out family card never mounts retained private services",async()=>{
 jest.mocked(useSession).mockReturnValue({state:{user:null,busy:false},client:{},pdf:{},capabilitiesReady:true,capabilities:{familyRead:true}} as never);
 const screen=await renderAsync(<FamilyRoute/>);expect(screen.getByText("login")).toBeTruthy();expect(FamilyScreen).not.toHaveBeenCalled();
});
