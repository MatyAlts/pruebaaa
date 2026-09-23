import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { StudyDetail } from '../src/StudyDetail';
import { StudyFilters } from '../src/StudyFilters';
import { PremiumIcon, PrimaryAction, SecondaryAction } from '../src/PremiumUI';

test('detail has a local native provider and compact action preserving real attachment opening', () => {
  const open=jest.fn();
  const screen=render(<StudyDetail study={{id:'test',title:'Estudio',date:'01-02-2026',files:[{id:'file',name:'document.pdf',mimeType:'application/pdf'}]}} busy={false} error={null} close={jest.fn()} openPdf={open}/>);
  expect(screen.UNSAFE_getByType(SafeAreaProvider)).toBeTruthy();
  expect(screen.UNSAFE_getAllByType(SecondaryAction).map(n=>n.props.title)).toContain('Volver a estudios');
  fireEvent.press(screen.getByRole('button',{name:'Abrir document.pdf'}));
  expect(open).toHaveBeenCalledWith('file');
});

test('filters use native modal area and system fields while applying real draft', () => {
  const apply=jest.fn();
  const screen=render(<StudyFilters visible filters={{q:'',medico:'',institution:'',month:'',year:''}} apply={apply} close={jest.fn()}/>);
  expect(screen.UNSAFE_getByType(SafeAreaProvider)).toBeTruthy();
  expect(StyleSheet.flatten(screen.UNSAFE_getAllByType(TextInput)[0].props.style).fontFamily).toBeUndefined();
  expect(screen.UNSAFE_getByType(PrimaryAction).props.title).toBe('Aplicar filtros');
  fireEvent.changeText(screen.getByLabelText('Mes'),'02');
  fireEvent.press(screen.getByRole('button',{name:'Aplicar filtros'}));
  expect(apply).toHaveBeenCalledWith(expect.objectContaining({month:'2'}));
});

test.each([24,32])('lock icon retains square native bounds at %i points', size => {
  const screen=render(<PremiumIcon name="lock" size={size}/>);
  const svg=screen.UNSAFE_getByType(Svg);
  expect(StyleSheet.flatten(svg.props.style)).toEqual(expect.objectContaining({width:size,height:size,flexShrink:0,flexGrow:0}));
  expect(svg.props.preserveAspectRatio).toBe('xMidYMid meet');
});
