import { fireEventAsync, renderAsync } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PrimaryAction, SecondaryAction, PremiumText } from '../src/PremiumUI';
import { StudiesScreen } from '../src/StudiesScreen';

test('primary action invokes real action and prevents disabled actions', async () => {
  const onPress = jest.fn();
  const screen = await renderAsync(<PrimaryAction title="Cargar estudio" onPress={onPress} />);
  await fireEventAsync.press(screen.getByRole('button', { name: 'Cargar estudio' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await screen.rerenderAsync(<PrimaryAction title="Cargar estudio" disabled onPress={onPress} />);
  await fireEventAsync.press(screen.getByRole('button', { name: 'Cargar estudio' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
test('screen text uses scalable system typography', async () => {
  const screen = await renderAsync(<PremiumText>Historial</PremiumText>);
  const text = screen.getByText('Historial');
  expect(StyleSheet.flatten(text.props.style).fontFamily).toBeUndefined();
  expect(text.props.allowFontScaling).toBe(true);
  expect(text.props.maxFontSizeMultiplier).toBeUndefined();
});
test('secondary actions retain real behavior and disabled state',async()=>{
 const onPress=jest.fn();
 const screen=await renderAsync(<SecondaryAction title="Reintentar" onPress={onPress}/>);
 await fireEventAsync.press(screen.getByRole('button',{name:'Reintentar'}));
 expect(onPress).toHaveBeenCalledTimes(1);
 await screen.rerenderAsync(<SecondaryAction title="Reintentar" onPress={onPress} disabled/>);
 await fireEventAsync.press(screen.getByRole('button',{name:'Reintentar'}));
 expect(onPress).toHaveBeenCalledTimes(1);
});
test('search clear removes the submitted server query', async () => {
  const get = jest.fn().mockResolvedValue({ items: [], nextCursor: null });
  const screen = await renderAsync(<StudiesScreen client={{get}} pdf={{open:jest.fn()}} advanced />);
  const input = screen.getByPlaceholderText('Buscar por título o descripción');
  await fireEventAsync.changeText(input, 'control');
  await fireEventAsync(input, 'submitEditing');
  await fireEventAsync.press(screen.getByRole('button', {name:'Limpiar búsqueda'}));
  expect(input.props.value).toBe('');
  expect(get).toHaveBeenLastCalledWith('/studies?sort=study-date-desc');
});
test('patient scope controls announce actual selection', async () => {
  const get = jest.fn().mockResolvedValue({items:[],nextCursor:null});
  const screen = await renderAsync(<StudiesScreen client={{get}} pdf={{open:jest.fn()}} advanced familyScope />);
  expect(screen.getByRole('button',{name:'Mi historial'}).props.accessibilityState.selected).toBe(true);
  await fireEventAsync.press(screen.getByRole('button',{name:'Todos los pacientes'}));
  expect(screen.getByRole('button',{name:'Todos los pacientes'}).props.accessibilityState.selected).toBe(true);
  expect(screen.getByText('Mostrando: todos los pacientes')).toBeTruthy();
});
test('family patients live in a compact selector sheet and choosing a patient closes it',async()=>{
 const get=jest.fn().mockImplementation((path:string)=>Promise.resolve(path==='/family-members'?{items:[{uuid:'family-test',name:'Paciente de prueba'}]}:{items:[],nextCursor:null}));
 const screen=await renderAsync(<StudiesScreen client={{get}} pdf={{open:jest.fn()}} advanced familyScope/>);
 expect(screen.queryByRole('button',{name:'Paciente: Paciente de prueba'})).toBeNull();
 await fireEventAsync.press(screen.getByRole('button',{name:'Seleccionar paciente'}));
 await fireEventAsync.press(screen.getByRole('button',{name:'Paciente: Paciente de prueba'}));
 expect(get).toHaveBeenLastCalledWith('/studies?sort=study-date-desc&scope=family&familyUuid=family-test');
 expect(screen.getByText('Mostrando: Paciente de prueba')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Mi historial'}).props.accessibilityState.selected).toBe(false);
});
test('failed patient query can retry while preserving the current studies scope',async()=>{
 let failed=true;
 const get=jest.fn().mockImplementation((path:string)=>path==='/family-members'&&failed?Promise.reject(new Error('Sin red')):Promise.resolve(path==='/family-members'?{items:[{uuid:'family-test',name:'Paciente de prueba'}]}:{items:[],nextCursor:null}));
 const screen=await renderAsync(<StudiesScreen client={{get}} pdf={{open:jest.fn()}} advanced familyScope/>);
 failed=false;
 await fireEventAsync.press(screen.getByRole('button',{name:'Reintentar pacientes'}));
 expect(screen.getByRole('button',{name:'Seleccionar paciente'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Mi historial'}).props.accessibilityState.selected).toBe(true);
});
