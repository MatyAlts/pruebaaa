import { act, renderAsync, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';
import { useReducedTransparency } from '../src/use-reduced-transparency';
function Preference(){return <Text>{String(useReducedTransparency())}</Text>;}
test('initial reduced transparency preference is read from iOS',async()=>{
 jest.spyOn(AccessibilityInfo,'isReduceTransparencyEnabled').mockResolvedValue(true);
 const screen=await renderAsync(<Preference/>);
 await waitFor(()=>expect(screen.getByText('true')).toBeTruthy());
});
test('transparency preference follows system changes',async()=>{
 jest.spyOn(AccessibilityInfo,'isReduceTransparencyEnabled').mockResolvedValue(false);
 let listener:(value:boolean)=>void=()=>{};
 const implementation=(event:string,callback:unknown)=>{if(event==='reduceTransparencyChanged')listener=callback as (value:boolean)=>void;return {remove:jest.fn()};};
 const spy=jest.spyOn(AccessibilityInfo,'addEventListener').mockImplementation(implementation as unknown as typeof AccessibilityInfo.addEventListener);
 const screen=await renderAsync(<Preference/>);
 await waitFor(()=>expect(screen.getByText('false')).toBeTruthy());
 await act(async()=>listener(true));
 expect(screen.getByText('true')).toBeTruthy();
 spy.mockRestore();
});
test('a newer system event wins over a late initial preference response',async()=>{
 let resolve!:(value:boolean)=>void;
 jest.spyOn(AccessibilityInfo,'isReduceTransparencyEnabled').mockReturnValue(new Promise<boolean>(done=>{resolve=done;}));
 let listener:(value:boolean)=>void=()=>{};
 const implementation=(event:string,callback:unknown)=>{if(event==='reduceTransparencyChanged')listener=callback as (value:boolean)=>void;return {remove:jest.fn()};};
 const spy=jest.spyOn(AccessibilityInfo,'addEventListener').mockImplementation(implementation as unknown as typeof AccessibilityInfo.addEventListener);
 const screen=await renderAsync(<Preference/>);
 await act(async()=>listener(false));
 await act(async()=>resolve(true));
 expect(screen.getByText('false')).toBeTruthy();
 spy.mockRestore();
});
