import { useHistoryStore } from '../model/store';
import { historySelectors } from '../model/selectors';

export function useHistoryIds() {
  return useHistoryStore(historySelectors.getHistoryIds);
}
