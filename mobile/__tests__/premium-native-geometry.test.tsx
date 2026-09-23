import { fireEvent, render } from '@testing-library/react-native';
import Svg, { LinearGradient, Rect } from 'react-native-svg';
import { PrimaryAction, PremiumHeader } from '../src/PremiumUI';
import { StyleSheet, View } from 'react-native';

test('gradient follows whole native button bounds after layout and expanded text height', () => {
  const screen = render(<PrimaryAction title="Guardar" onPress={jest.fn()} />);
  const button = screen.getByRole('button', {name:'Guardar'});
  fireEvent(button, 'layout', {nativeEvent:{layout:{x:0,y:0,width:353,height:58}}});
  let gradient = screen.UNSAFE_getAllByType(Svg).find(svg => svg.props.testID === 'primary-gradient');
  expect(gradient?.props.width).toBe(353);
  expect(gradient?.props.height).toBe(58);
  expect(gradient?.props.viewBox).toBe('0 0 353 58');
  fireEvent(button, 'layout', {nativeEvent:{layout:{x:0,y:0,width:280,height:104}}});
  gradient = screen.UNSAFE_getAllByType(Svg).find(svg => svg.props.testID === 'primary-gradient');
  expect(gradient?.props.height).toBe(104);
  expect(screen.UNSAFE_getByType(Rect).props.height).toBe(104);
});

test('zero native layout keeps opaque fallback and never creates invalid viewport', () => {
  const screen = render(<PrimaryAction title="Guardar" onPress={jest.fn()} />);
  const button = screen.getByRole('button',{name:'Guardar'});
  expect(StyleSheet.flatten(button.props.style).backgroundColor).toBe('#2456C5');
  fireEvent(button, 'layout', {nativeEvent:{layout:{x:0,y:0,width:0,height:0}}});
  expect(screen.queryByTestId('primary-gradient')).toBeNull();
});

test('multiple buttons keep separate gradient references', () => {
  const screen=render(<View><PrimaryAction title="Guardar" onPress={jest.fn()}/><PrimaryAction title="Cargar" onPress={jest.fn()}/></View>);
  for (const title of ['Guardar','Cargar']) fireEvent(screen.getByRole('button',{name:title}), 'layout', {nativeEvent:{layout:{x:0,y:0,width:320,height:56}}});
  const ids=screen.UNSAFE_getAllByType(LinearGradient).map(node=>node.props.id);
  expect(new Set(ids).size).toBe(2);
  expect(screen.UNSAFE_getAllByType(Rect).map(node=>node.props.fill)).toEqual(ids.map(id=>`url(#${id})`));
});

test('header accessory sits beside the complete text block rather than stretching eyebrow row', () => {
  const screen=render(<PremiumHeader eyebrow="MI SALUTECA" title="Hola" subtitle="Tu salud" accessory={<View testID="avatar"/>}/>);
  const textBlock=screen.getByTestId('header-copy');
  expect(textBlock.findByProps({children:'Hola'})).toBeTruthy();
  expect(textBlock.findAllByProps({testID:'avatar'})).toHaveLength(0);
});
