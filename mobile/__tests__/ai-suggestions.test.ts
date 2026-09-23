import { validateSuggestions, applySuggestions } from '../src/ai-suggestions';
const draft={date:'10-09-2026',title:'Manual',institution:'',medico:'',conclusion:'',description:'',patient:'self' as const,files:[]};
test('valid civil leap date and supported fields pass without timezone conversion',()=>{
  expect(validateSuggestions({date:'29-02-2028',title:'Control',institution:'',medico:'',conclusion:''})).toMatchObject({date:'29-02-2028',title:'Control'});
});
test.each([{date:'29-02-2027'},{title:'x'.repeat(401)},{diagnosis:'invented'}])('invalid clinical suggestions are rejected (%j)',value=>{
  expect(()=>validateSuggestions(value)).toThrow();
});
test('applying selected fields preserves fields edited since analysis and never changes patient/files',()=>{
  const result=applySuggestions(draft,{title:'Suggested',date:'11-09-2026'},['title','date'],{title:0,date:0},{title:1,date:0});
  expect(result.title).toBe('Manual'); expect(result.date).toBe('11-09-2026'); expect(result.files).toBe(draft.files); expect(result.patient).toBe('self');
});
test('explicit field overwrite confirmation allows only the selected dirty field',()=>{
  expect(applySuggestions(draft,{title:'Suggested',date:'11-09-2026'},['title'],{title:0},{title:1},['title'])).toMatchObject({title:'Suggested',date:'10-09-2026'});
});
