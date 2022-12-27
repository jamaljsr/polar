import { TaroApi } from '@hodlone/taro-api';

export type ListAssetsResponse = Awaited<ReturnType<TaroApi['listAssets']>>;
