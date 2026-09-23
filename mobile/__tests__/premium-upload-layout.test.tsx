import { fireEvent, render } from '@testing-library/react-native';
import { KeyboardAvoidingView, StyleSheet, TextInput, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UploadScreen } from '../src/UploadScreen';
import { UploadEntry } from '../src/UploadEntry';
import { StudiesScreen } from '../src/StudiesScreen';
import { PrimaryAction, SecondaryAction } from '../src/PremiumUI';
jest.mock('expo-crypto',()=>({randomUUID:()=> 'key'}));
jest.mock('../src/use-reduced-motion',()=>({useReducedMotion:()=>false}));

test('upload uses one safe area owner and keyboard avoidance with system text fields', () => {
  const props={coordinator:{key:null} as never,files:{} as never,close:jest.fn()};
  const screen=render(<UploadScreen {...props}/>);
  expect(screen.UNSAFE_getAllByType(SafeAreaView)).toHaveLength(1);
  expect(screen.UNSAFE_getAllByType(SafeAreaProvider)).toHaveLength(1);
  expect(screen.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
  expect(StyleSheet.flatten(screen.UNSAFE_getAllByType(TextInput)[0].props.style).fontFamily).toBeUndefined();
  expect(screen.UNSAFE_getAllByType(PrimaryAction).map(x=>x.props.title)).toEqual(['Guardar estudio']);
  screen.rerender(<UploadScreen {...props} safeArea={false}/>);
  expect(screen.UNSAFE_queryAllByType(SafeAreaView)).toHaveLength(0);
  expect(screen.UNSAFE_queryAllByType(SafeAreaProvider)).toHaveLength(0);
});

test('patient choices announce selected state and retain real draft selection', () => {
  const screen=render(<UploadScreen coordinator={{key:null} as never} files={{} as never} close={jest.fn()} families={[{uuid:'family-test',name:'Paciente de prueba'}]}/>);
  expect(screen.getByRole('button',{name:'Mi historial'}).props.accessibilityState.selected).toBe(true);
  fireEvent.press(screen.getByRole('button',{name:'Paciente de prueba'}));
  expect(screen.getByRole('button',{name:'Paciente de prueba'}).props.accessibilityState.selected).toBe(true);
  expect(screen.getByRole('button',{name:'Mi historial'}).props.accessibilityState.selected).toBe(false);
});

test('Studies upload is a discrete secondary action retaining modal opening', () => {
  const screen=render(<UploadEntry compact enabled client={{get:jest.fn().mockResolvedValue({items:[]})} as never} files={{clear:jest.fn()} as never} onChanged={jest.fn()}/>);
  expect(screen.UNSAFE_queryAllByType(PrimaryAction)).toHaveLength(0);
  expect(screen.UNSAFE_getByType(SecondaryAction).props.title).toBe('Cargar estudio');
});

test('Studies title precedes contextual upload action', async () => {
  const screen=render(<StudiesScreen client={{get:jest.fn().mockResolvedValue({items:[],nextCursor:null})}} pdf={{open:jest.fn()}} header={<SecondaryAction title="Cargar estudio" onPress={jest.fn()}/>}/>);
  await screen.findByText('Mis estudios');
  const texts=screen.UNSAFE_getAllByType(Text).map(node=>node.props.children);
  expect(texts.indexOf('Mis estudios')).toBeLessThan(texts.indexOf('Cargar estudio'));
});
