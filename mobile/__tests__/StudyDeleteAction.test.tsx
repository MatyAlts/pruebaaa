import { fireEventAsync, renderAsync } from '@testing-library/react-native';
import { StudyDeleteAction } from '../src/StudyDeleteAction';

test('opening and canceling destructive confirmation never writes',async()=>{
  const write=jest.fn(); const changed=jest.fn();
  const screen=await renderAsync(<StudyDeleteAction studyId="study" client={{get:jest.fn(),write}} onChanged={changed}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar estudio'}));
  expect(screen.getByText(/Se eliminarán el estudio/)).toBeTruthy();
  await fireEventAsync.press(screen.getByRole('button',{name:'Cancelar eliminación'}));
  expect(write).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled();
});
test('confirmation refreshes real history after logical commit and explains pending physical cleanup',async()=>{
  const write=jest.fn().mockImplementation((_path,_method,body)=>Promise.resolve({operationId:body.idempotencyKey,status:'committed'}));
  const changed=jest.fn();
  const screen=await renderAsync(<StudyDeleteAction studyId="study" client={{get:jest.fn(),write}} onChanged={changed}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar estudio'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Eliminar definitivamente'}));
  expect(write).toHaveBeenCalledTimes(1); expect(changed).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/limpieza de archivos/)).toBeTruthy();
});
