import { StudyDeletion } from '../src/study-deletion';
import { SessionError } from '../src/session';

test('logical commit uses explicit confirmation and refreshes once before physical cleanup',async()=>{
  const write=jest.fn().mockResolvedValue({operationId:'key',status:'committed'});
  const get=jest.fn().mockResolvedValue({operationId:'key',status:'complete'});
  const changed=jest.fn();
  const operation=new StudyDeletion({write,get},'study',()=> 'key',changed);
  await operation.confirm(); await operation.reconcile();
  expect(write).toHaveBeenCalledWith('/studies/study','DELETE',{confirmation:'misaluteca',idempotencyKey:'key'});
  expect(get).toHaveBeenCalledWith('/study-deletions/key');
  expect(changed).toHaveBeenCalledTimes(1);
});

test('ambiguous response keeps the same key and only reconciles without repeating DELETE',async()=>{
  const write=jest.fn().mockRejectedValue(new Error('Sin red'));
  const get=jest.fn().mockResolvedValue({operationId:'key',status:'committed'});
  const changed=jest.fn();
  const operation=new StudyDeletion({write,get},'study',()=> 'key',changed);
  await expect(operation.confirm()).rejects.toThrow('Sin red');
  expect(operation.locked).toBe(true);
  await operation.confirm(); await operation.reconcile();
  expect(write).toHaveBeenCalledTimes(1); expect(changed).toHaveBeenCalledTimes(1);
});

test('cleanup discards a late commit and forbids new writes',async()=>{
  let finish!: (value:unknown)=>void;
  const write=jest.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const changed=jest.fn();
  const operation=new StudyDeletion({write,get:jest.fn()},'study',()=> 'key',changed);
  const pending=operation.confirm(); operation.cleanup();
  finish({operationId:'key',status:'complete'}); await pending;
  await operation.confirm();
  expect(changed).not.toHaveBeenCalled(); expect(write).toHaveBeenCalledTimes(1);
});
test.each(['403','404'])('definitive server refusal %s unlocks back without treating it as a commit',async code=>{
  const changed=jest.fn();
  const operation=new StudyDeletion({write:jest.fn().mockRejectedValue(new SessionError(code,'No disponible')),get:jest.fn()},'study',()=> 'key',changed);
  await expect(operation.confirm()).rejects.toThrow('No disponible');
  expect(operation.locked).toBe(false); expect(changed).not.toHaveBeenCalled();
});
