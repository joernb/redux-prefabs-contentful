import { ContentfulClientApi, createClient, CreateClientParams, EntryCollection, Entry, AssetCollection, Asset, LocaleCollection, Space } from "contentful";
import { FSA } from "flux-standard-action";
import { Middleware } from "redux";

type ContentfulId = string;
type ContentfulQuery = any;

interface ContentfulRequest {
  clientId: string;
  operation: (client: ContentfulClientApi) => void;
};

export interface ContentfulRequestAction extends FSA<ContentfulRequest> {
  type: "ContentfulRequest";
  payload: ContentfulRequest;
}

export const contentfulClient = (
  {
    clientId = "",
    params
  }: {
    clientId?: string;
    params: CreateClientParams;
  }
): Middleware =>
  api => next => {
    const client = createClient(params);
    return (action: ContentfulRequestAction) => {
      const result = next(action);
      if (action.type === "ContentfulRequest" && action.payload.clientId === clientId) {
        action.payload.operation(client);
      }
      return result;
    }
  };

const contentfulRequest = <
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    performRequest
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    performRequest: (client: ContentfulClientApi, payload: RequestAction["payload"]) =>
      Promise<ResponseAction["payload"]>;
  }
): Middleware =>
  api => next => (action: RequestAction) => {
    const result = next(action);
    if (action.type === requestType) {
      api.dispatch({
        type: "ContentfulRequest",
        payload: {
          clientId,
          operation: async (client) => {
            try {
              api.dispatch({
                type: responseType,
                payload: await performRequest(client, action.payload)
              } as ResponseAction);
            } catch (error) {
              api.dispatch({
                type: responseType,
                payload: error,
                error: true
              } as ResponseAction);
            }
          }
        }
      } as ContentfulRequestAction);
    }
    return result;
  };

export const contentfulGetEntries = <
  Entity,
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapRequest,
    mapResponse = entries =>
      entries.items.map(entry => ({
        ...entry.fields,
        id: entry.sys.id
      }))
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapRequest: (payload: RequestAction["payload"]) => ContentfulQuery;
    mapResponse?: (entries: EntryCollection<Entity>) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getEntries(mapRequest(requestPayload)))
  });

export const contentfulGetEntry = <
  Entity,
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapRequest,
    mapResponse = entry => ({
      ...entry.fields,
      id: entry.sys.id
    })
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapRequest: (payload: RequestAction["payload"]) => ContentfulId;
    mapResponse?: (entry: Entry<Entity>) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getEntry(mapRequest(requestPayload)))
  });

export const contentfulGetAssets = <
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapRequest,
    mapResponse = assets =>
      assets.items.map(asset => ({
        ...asset.fields,
        id: asset.sys.id
      }))
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapRequest: (payload: RequestAction["payload"]) => ContentfulQuery;
    mapResponse?: (entry: AssetCollection) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getAssets(mapRequest(requestPayload)))
  });

export const contentfulGetAsset = <
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapRequest,
    mapResponse = asset => ({
      ...asset.fields,
      id: asset.sys.id
    })
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapRequest: (payload: RequestAction["payload"]) => ContentfulId;
    mapResponse?: (asset: Asset) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getAsset(mapRequest(requestPayload)))
  });

export const contentfulGetSpace = <
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapResponse = space => space
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapResponse?: (space: Space) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getSpace())
  });

export const contentfulGetLocales = <
  RequestAction extends FSA<any>,
  ResponseAction extends FSA<any>
>(
  {
    clientId = "",
    requestType,
    responseType,
    mapResponse = locales =>
      locales.items.map(locale => ({
        ...locale,
        id: locale.sys.id
      }))
  }: {
    clientId?: string;
    requestType: RequestAction["type"];
    responseType: ResponseAction["type"];
    mapResponse?: (locale: LocaleCollection) => ResponseAction["payload"];
  }
): Middleware =>
  contentfulRequest<
    RequestAction,
    ResponseAction
  >({
    clientId,
    requestType,
    responseType,
    performRequest: async (client, requestPayload) =>
      mapResponse(await client.getLocales())
  });
