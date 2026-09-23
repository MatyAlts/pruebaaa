import { render } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
const mockScreens:Record<string,unknown>={};
jest.mock("../src/session-provider",()=>({SessionProvider:({children}:{children:unknown})=>children}));
jest.mock("expo-router",()=>({DefaultTheme:{},ThemeProvider:({children}:{children:unknown})=>children,Stack:Object.assign(({children}:{children:unknown})=>children,{Screen:({name,options}:{name:string;options:unknown})=>{mockScreens[name]=options;return null;}})}));
test("upload, family folder and family form retain real horizontal native stack back",()=>{
 render(<RootLayout/>);
 for(const name of ["upload","family/[uuid]","family-form"]) expect(mockScreens[name]).toMatchObject({presentation:"card",gestureEnabled:true,gestureDirection:"horizontal",headerShown:true});
});
test("existing study detail native presentation is preserved",()=>{
 render(<RootLayout/>);expect(mockScreens["study/[id]"]).toMatchObject({presentation:"card",gestureEnabled:true});
});
