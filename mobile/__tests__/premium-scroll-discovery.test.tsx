import { renderAsync } from '@testing-library/react-native';
import { FlatList, ScrollView, View } from 'react-native';
import { HomeScreen } from '../src/HomeScreen';
import { StudiesScreen } from '../src/StudiesScreen';
import { FamilyScreen } from '../src/FamilyScreen';
import { ScreenBackdrop } from '../src/PremiumUI';
import Account from '../app/(tabs)/account';
jest.mock('../src/session-provider',()=>({useSession:()=>({state:{user:null,busy:false,message:null},client:{logout:jest.fn()}})}));

test.each(['home','studies','family','account'])('native scroll discovery sees %s content before decoration', async name => {
  const client={get:jest.fn().mockResolvedValue({items:[],nextCursor:null,propiosTotal:0,recientes:[]})};
  const pdf={open:jest.fn()};
  const element=name==='home'?<HomeScreen name={null} client={client} pdf={pdf}/>:name==='studies'?<StudiesScreen client={client} pdf={pdf}/>:name==='account'?<Account/>:<FamilyScreen client={client as never} pdf={pdf} onChanged={jest.fn()}/>;
  const screen=await renderAsync(element);
  const container=screen.UNSAFE_getAllByType(View)[0];
  const children=Array.isArray(container.props.children)?container.props.children:[container.props.children];
  expect(children[0].type).toBe(name==='home'||name==='account'?ScrollView:FlatList);
  expect(screen.UNSAFE_getByType(ScreenBackdrop)).toBeTruthy();
});
