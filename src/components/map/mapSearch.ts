export function searchPlaces(placeSearch: any, query: string, limit = 5): Promise<any[]> {
  return new Promise((resolve, reject) => {
    placeSearch.search(query, (status: string, result: any) => {
      if (status === 'complete' && result.poiList?.pois) {
        resolve(result.poiList.pois.slice(0, limit));
        return;
      }

      if (status === 'error') {
        reject(new Error('搜索失败，请重试'));
        return;
      }

      resolve([]);
    });
  });
}
