import { fireEventAsync, renderAsync } from '@testing-library/react-native';
import { UploadScreen } from '../src/UploadScreen';
import { pickUploadDocuments } from '../src/upload-picker';
jest.mock('expo-crypto',()=>({randomUUID:()=> '00000000-0000-4000-8000-000000000001'}));
jest.mock('../src/upload-picker',()=>({...jest.requireActual('../src/upload-picker'),pickUploadDocuments:jest.fn()}));
const file={uri:'file:///cache/uploads/report.pdf',name:'report.pdf',mimeType:'application/pdf',size:10};
test('accepted analysis fields populate the real upload draft without submitting until Save',async()=>{
  jest.mocked(pickUploadDocuments).mockResolvedValueOnce([{...file,lastModified:0}]);
  const submit=jest.fn().mockResolvedValue({status:'complete'});
  const write=jest.fn().mockImplementation((_p,_m,b)=>Promise.resolve({requestId:b.requestId,status:'completed',suggestions:{title:'Suggested',date:'10-09-2026'}}));
  const screen=await renderAsync(<UploadScreen coordinator={{key:null,submit} as never} files={{import:jest.fn().mockResolvedValue(file),remove:jest.fn()} as never} close={jest.fn()} ai={{enabled:true,client:{get:jest.fn(),write},ocr:{extract:jest.fn().mockResolvedValue({text:'Synthetic local text',pages:1}),cancel:jest.fn().mockResolvedValue(undefined),clear:jest.fn().mockResolvedValue(undefined)}}}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Adjuntar desde Files'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Aplicar campos seleccionados'}));
  expect(screen.getByDisplayValue('Suggested')).toBeTruthy(); expect(submit).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole('button',{name:'Guardar estudio'}));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({title:'Suggested',date:'10-09-2026',patient:'self',files:[file]}));
});
test('manual upload remains unchanged when assistance is not supplied',async()=>{
  const screen=await renderAsync(<UploadScreen coordinator={{key:null} as never} files={{} as never} close={jest.fn()}/>);
  expect(screen.queryByText('Ayuda para completar los datos')).toBeNull();
  expect(screen.getByRole('button',{name:'Guardar estudio'})).toBeTruthy();
});
