import { renderAsync, fireEventAsync } from '@testing-library/react-native';
import { StudiesScreen } from '../src/StudiesScreen';
import { HomeScreen } from '../src/HomeScreen';

test('Studies preserves query/filter scope and hands selected ID to native route', async () => {
  const get=jest.fn().mockResolvedValue({items:[{id:'study-test',title:'Control',date:'10-09-2026'}],nextCursor:null});
  const open=jest.fn();
  const screen=await renderAsync(<StudiesScreen client={{get}} pdf={{open:jest.fn()}} onOpenStudy={open}/>);
  await screen.findByRole('button',{name:'Control'});
  await fireEventAsync.press(screen.getByRole('button',{name:'Control'}));
  expect(open).toHaveBeenCalledWith('study-test');
  expect(get).toHaveBeenCalledTimes(1);
});

test('Home recent card opens same native route without duplicate detail request', async () => {
  const get=jest.fn().mockResolvedValue({propiosTotal:1,recientes:[{id:'study-test',title:'Control',date:'10-09-2026'}]});
  const open=jest.fn();
  const screen=await renderAsync(<HomeScreen name={null} client={{get}} pdf={{open:jest.fn()}} onOpenStudy={open}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Control'}));
  expect(open).toHaveBeenCalledWith('study-test');
  expect(get).toHaveBeenCalledTimes(1);
});
