import { loadCapabilities } from '../src/capabilities';
test('advertised deletion and analysis are exposed only when explicitly ready',async()=>{
  const result=await loadCapabilities({get:jest.fn().mockResolvedValue({features:{studiesRead:true,studiesDelete:true,studiesAnalyze:true}})});
  expect(result).toMatchObject({studiesDelete:true,studiesAnalyze:true});
});
test('missing or false analysis/deletion capability keeps both unavailable',async()=>{
  const result=await loadCapabilities({get:jest.fn().mockResolvedValue({features:{studiesRead:true,studiesDelete:false}})});
  expect(result.studiesDelete).toBeUndefined(); expect(result.studiesAnalyze).toBeUndefined();
});
