import { fireEventAsync, renderAsync } from '@testing-library/react-native';
import { HomeScreen } from '../src/HomeScreen';
test('real history overview links to the existing studies tab', async()=>{
 const viewAll=jest.fn();
 const screen=await renderAsync(<HomeScreen client={{get:jest.fn().mockResolvedValue({propiosTotal:4,recientes:[]})}} pdf={{open:jest.fn()}} name="Persona" onViewAll={viewAll}/>);
 await fireEventAsync.press(screen.getByRole('button',{name:'Ver todos'}));
 expect(viewAll).toHaveBeenCalledTimes(1);
});
test('no tab action is fabricated if navigation callback is absent',async()=>{
 const screen=await renderAsync(<HomeScreen client={{get:jest.fn().mockResolvedValue({propiosTotal:4,recientes:[]})}} pdf={{open:jest.fn()}} name="Persona"/>);
 expect(screen.queryByRole('button',{name:'Ver todos'})).toBeNull();
});
test('summary cards open actual destinations without interpreting family studies as people',async()=>{
 const own=jest.fn(),family=jest.fn();
 const screen=await renderAsync(<HomeScreen client={{get:jest.fn().mockResolvedValue({propiosTotal:4,familiaresTotal:9,total:13,recientes:[]})}} pdf={{open:jest.fn()}} name="Persona" familyScope onViewAll={own} onViewFamily={family}/>);
 await fireEventAsync.press(screen.getByRole('button',{name:'Abrir mis estudios'}));
 await fireEventAsync.press(screen.getByRole('button',{name:'Abrir estudios familiares'}));
 expect(own).toHaveBeenCalledTimes(1);expect(family).toHaveBeenCalledTimes(1);
 expect(screen.getByText('9')).toBeTruthy();expect(screen.getByText('13')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Abrir mis estudios'}).props.accessibilityHint).toContain('4');
 expect(screen.getByRole('button',{name:'Abrir estudios familiares'}).props.accessibilityHint).toMatch(/9.*13/);
});
