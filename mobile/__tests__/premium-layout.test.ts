import { stackSummaryCards } from '../src/premium-theme';
test('summary cards share a row on a standard iPhone width and font size',()=>{
 expect(stackSummaryCards(393,1)).toBe(false);
});
test('summary cards stack for narrow screens and enlarged text',()=>{
 expect(stackSummaryCards(320,1)).toBe(true);
 expect(stackSummaryCards(393,1.6)).toBe(true);
});
