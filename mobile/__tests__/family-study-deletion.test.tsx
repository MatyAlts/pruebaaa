import { fireEventAsync, renderAsync } from '@testing-library/react-native';
import { FamilyScreen } from '../src/FamilyScreen';
const member={id:'1',uuid:'family-test',name:'Familiar',studyCount:1,lastStudyDate:null};
function client(){return {get:jest.fn().mockImplementation((path:string)=>Promise.resolve(path==='/family-members'?{items:[member]}:path.startsWith('/studies/')?{study:{id:'study-test',title:'Control',date:'10-09-2026'}}:path.includes('/studies?')?{items:[{id:'study-test',title:'Control',date:'10-09-2026'}],nextCursor:null}:{familyMember:member})),write:jest.fn().mockImplementation((_p,_m,b)=>Promise.resolve({operationId:b.idempotencyKey,status:'committed'}))};}
test('family study deletion uses the owned detail and refreshes folder and family counts',async()=>{
  const api=client(); const changed=jest.fn();
  const screen=await renderAsync(<FamilyScreen client={api} pdf={{open:jest.fn()}} canDeleteStudies onChanged={changed}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Abrir carpeta de Familiar'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Control'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar estudio'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar definitivamente'}));
  expect(changed).toHaveBeenCalledTimes(1);
  expect(api.get.mock.calls.filter(([path])=>path==='/family-members').length).toBeGreaterThan(1);
  expect(screen.queryByRole('button',{name:'Abrir documento'})).toBeNull();
});
test('family read permission alone never exposes study deletion',async()=>{
  const screen=await renderAsync(<FamilyScreen client={client()} pdf={{open:jest.fn()}}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Abrir carpeta de Familiar'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Control'}));
  expect(screen.queryByRole('button',{name:'Eliminar estudio'})).toBeNull();
});
