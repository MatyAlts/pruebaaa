import { fireEvent, render } from '@testing-library/react-native';
import { CalendarInput, civilDateFromLocalDate } from '../src/CalendarInput';

jest.mock('@expo/ui/community/datetime-picker',()=>({__esModule:true,default:jest.requireActual('react-native').View}));
jest.mock('@expo/ui/jetpack-compose',()=>({Host:jest.requireActual('react-native').View,DateTimePicker:jest.requireActual('react-native').View}));

test.each([[2028,1,29,'29-02-2028'],[2026,11,31,'31-12-2026']])('native selection serializes local civil date %i/%i/%i', (year,month,day,expected) => {
  expect(civilDateFromLocalDate(new Date(year,month,day,23,30))).toBe(expected);
});

test('calendar opens native picker and commits chosen date only on confirmation', () => {
  const changed=jest.fn();
  const screen=render(<CalendarInput value="" onChange={changed}/>);
  fireEvent.press(screen.getByRole('button',{name:'Fecha del estudio'}));
  fireEvent(screen.getByTestId('study-date-picker'),'change',{type:'set'},new Date(2028,1,29));
  expect(changed).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button',{name:'Confirmar fecha'}));
  expect(changed).toHaveBeenCalledWith('29-02-2028');
});

test('disabled calendar cannot open or overwrite locked draft', () => {
  const screen=render(<CalendarInput value="10-09-2026" disabled onChange={jest.fn()}/>);
  fireEvent.press(screen.getByRole('button',{name:'Fecha del estudio'}));
  expect(screen.queryByTestId('study-date-picker')).toBeNull();
});

test('draft becoming locked while calendar is open prevents confirmation',()=>{
  const changed=jest.fn();
  const screen=render(<CalendarInput value="10-09-2026" onChange={changed}/>);
  fireEvent.press(screen.getByRole('button',{name:'Fecha del estudio'}));
  screen.rerender(<CalendarInput value="10-09-2026" onChange={changed} disabled/>);
  fireEvent.press(screen.getByRole('button',{name:'Confirmar fecha'}));
  expect(changed).not.toHaveBeenCalled();
});

test('canceling native date selection preserves the existing civil date',()=>{
  const changed=jest.fn();
  const screen=render(<CalendarInput value="10-09-2026" onChange={changed}/>);
  fireEvent.press(screen.getByRole('button',{name:'Fecha del estudio'}));
  fireEvent(screen.getByTestId('study-date-picker'),'change',{type:'set'},new Date(2028,1,29));
  fireEvent.press(screen.getByRole('button',{name:'Cancelar fecha'}));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.queryByTestId('study-date-picker')).toBeNull();
});
