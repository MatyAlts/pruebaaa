import { act, fireEventAsync, renderAsync } from '@testing-library/react-native';
import { AiAssist } from '../src/AiAssist';
jest.mock('expo-crypto',()=>({randomUUID:()=> '00000000-0000-4000-8000-000000000001'}));
const file={uri:'file:///cache/uploads/report.pdf',name:'report.pdf',mimeType:'application/pdf',size:10};
const draft={date:'',title:'Manual',institution:'',medico:'',conclusion:'',description:'',patient:'self' as const,files:[file]};
function adapters(){
  return {ocr:{extract:jest.fn().mockResolvedValue({text:'Synthetic local text',pages:1}),cancel:jest.fn().mockResolvedValue(undefined),clear:jest.fn().mockResolvedValue(undefined)},client:{get:jest.fn().mockResolvedValue({status:'completed'}),write:jest.fn().mockImplementation((_p,_m,b)=>Promise.resolve({requestId:b.requestId,status:'completed',suggestions:{title:'Suggested',institution:'',medico:'',date:'10-09-2026',conclusion:''}}))},apply:jest.fn()};
}
test('local extraction never sends text before explicit consent and suggestions never autosave',async()=>{
  const {ocr,client,apply}=adapters();
  const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled onApply={apply}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  expect(screen.getByDisplayValue('Synthetic local text')).toBeTruthy(); expect(client.write).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  expect(client.write).toHaveBeenCalledWith('/studies/analyze','POST',expect.objectContaining({ocrText:'Synthetic local text'}));
  expect(apply).not.toHaveBeenCalled();
  await fireEventAsync.press(screen.getByRole('button',{name:'Aplicar campos seleccionados'}));
  expect(apply).toHaveBeenCalledTimes(1);
});
test('response after document removal is discarded and native extraction canceled',async()=>{
  const {ocr,client,apply}=adapters(); let finish!: (value:unknown)=>void;
  ocr.extract.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}) as never);
  const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled onApply={apply}/>);
  const button=screen.getByRole('button',{name:'Extraer texto de report.pdf'});
  await fireEventAsync.press(button);
  await screen.rerenderAsync(<AiAssist files={[]} draft={{...draft,files:[]}} versions={{}} ocr={ocr} client={client} enabled onApply={apply}/>);
  await act(async()=>finish({text:'Discarded text',pages:1}));
  expect(screen.queryByDisplayValue('Discarded text')).toBeNull(); expect(client.write).not.toHaveBeenCalled(); expect(ocr.cancel).toHaveBeenCalled();
});
test('missing server capability retains local extraction without paid analysis action',async()=>{
  const {ocr,client,apply}=adapters();
  const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled={false} onApply={apply}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  expect(screen.queryByRole('button',{name:'Enviar texto y analizar con IA'})).toBeNull(); expect(client.write).not.toHaveBeenCalled();
});
test('lost analysis response reconciles status without another paid POST',async()=>{
  const {ocr,client,apply}=adapters(); client.write.mockRejectedValue(new Error('Sin red'));
  const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled onApply={apply}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Verificar análisis'}));
  expect(client.get).toHaveBeenCalledWith(expect.stringMatching(/^\/study-analyses\//)); expect(client.write).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/no pueden recuperarse/)).toBeTruthy(); expect(apply).not.toHaveBeenCalled();
});

test('field edited during paid analysis requires explicit field overwrite confirmation',async()=>{
  const {ocr,client,apply}=adapters(); let finish!: (value:unknown)=>void;
  client.write.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const props={files:[file],draft,versions:{title:0},ocr,client,enabled:true,onApply:apply};
  const screen=await renderAsync(<AiAssist {...props}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  await screen.rerenderAsync(<AiAssist {...props} draft={{...draft,title:'Edited'}} versions={{title:1}}/>);
  await act(async()=>finish({requestId:'00000000-0000-4000-8000-000000000001',status:'completed',suggestions:{title:'Suggested'}}));
  const choice=screen.getByRole('checkbox',{name:'Confirmar reemplazo de Título'});
  expect(choice.props.accessibilityState.checked).toBe(false);
  await fireEventAsync.press(choice);
  await fireEventAsync.press(screen.getByRole('button',{name:'Aplicar campos seleccionados'}));
  expect(apply).toHaveBeenCalledWith({title:'Suggested'},['title'],{title:0},['title']);
});

test('canceling a submitted analysis discards late suggestions without a new paid call',async()=>{
  const {ocr,client,apply}=adapters(); let finish!: (value:unknown)=>void;
  client.write.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled onApply={apply}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  await fireEventAsync.press(screen.getByRole('button',{name:'Cancelar asistencia'}));
  await act(async()=>finish({requestId:'00000000-0000-4000-8000-000000000001',status:'completed',suggestions:{title:'Discarded'}}));
  expect(screen.queryByText('Sugerencia: Discarded')).toBeNull();
  expect(client.write).toHaveBeenCalledTimes(1); expect(apply).not.toHaveBeenCalled();
});

test('editing again after field overwrite confirmation invalidates that confirmation',async()=>{
  const {ocr,client,apply}=adapters();
  const props={files:[file],draft,versions:{title:0},ocr,client,enabled:true,onApply:apply};
  const screen=await renderAsync(<AiAssist {...props}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Extraer texto de report.pdf'}));
  await screen.rerenderAsync(<AiAssist {...props} versions={{title:1}}/>);
  await fireEventAsync.press(screen.getByRole('button',{name:'Enviar texto y analizar con IA'}));
  await fireEventAsync.press(screen.getByRole('checkbox',{name:'Confirmar reemplazo de Título'}));
  await screen.rerenderAsync(<AiAssist {...props} versions={{title:2}}/>);
  expect(screen.getByRole('checkbox',{name:'Confirmar reemplazo de Título'}).props.accessibilityState.checked).toBe(false);
  await fireEventAsync.press(screen.getByRole('button',{name:'Aplicar campos seleccionados'}));
  expect(apply.mock.calls[0]?.[3] ?? []).not.toContain('title');
});

test.each([false,true])("submitted analysis reports pending exit warning after lost response %s",async(lost)=>{
 const {ocr,client,apply}=adapters();const pending=jest.fn();
 let finish!:(value:unknown)=>void;
 client.write.mockImplementation(()=>lost?Promise.reject(new Error("Sin red")):new Promise(resolve=>{finish=resolve;}) as never);
 const screen=await renderAsync(<AiAssist files={[file]} draft={draft} versions={{}} ocr={ocr} client={client} enabled onApply={apply} onPendingAnalysis={pending}/>);
 expect(pending).toHaveBeenLastCalledWith(false,null);
 await fireEventAsync.press(screen.getByRole("button",{name:"Extraer texto de report.pdf"}));
 await fireEventAsync.press(screen.getByRole("button",{name:"Enviar texto y analizar con IA"}));
 expect(pending).toHaveBeenLastCalledWith(true,"00000000-0000-4000-8000-000000000001");
 if(!lost){await act(async()=>finish({requestId:"00000000-0000-4000-8000-000000000001",status:"completed",suggestions:{title:"Suggested",institution:"",medico:"",date:"",conclusion:""}}));expect(pending).toHaveBeenLastCalledWith(false,expect.anything());}
});
