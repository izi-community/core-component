import {API} from "../configs";

export function getImage(url?: string, size: any = 'SM', mode: string | undefined = undefined) {
  let _api = API;
  if (import.meta.env.NODE_ENV === 'production') {
    _api = process.env.NEXT_PUBLIC_API ?? "";
  }

  if (!url) return '';

  if (url.indexOf('https://trainiziprd1.blob.core.windows.net/') === 0) {
    url = url.replace('https://trainiziprd1.blob.core.windows.net/', 'https://trainizicdn1-chctbadndwa4g3c5.z03.azurefd.net/');
  }

  // for other hosting
  if (url.indexOf('http') == 0 || url.indexOf('https') == 0) return url;

  // for backward compatible
  if (url.indexOf('prod_images') === 0 || url.indexOf('dev_images') === 0 || url.indexOf('images') === 0)
    return `https://d20ypkwyl23eqp.cloudfront.net/${url}`;

  if (url.indexOf('slides') === 0) {
    return `https://d20ypkwyl23eqp.cloudfront.net/${url}`;
  }

  if (url.indexOf('certificates/') === 0) {
    return `https://d20ypkwyl23eqp.cloudfront.net/${url}`;
  }

  // for new implementation
  return `${_api}/asset/image/${url}?size=${size}`;
}

export function getVideo(url?: string) {
  if(url === 'https://trainizi.com/ev_final (2).mp4') {
    return 'https://izi-prod-bucket.s3.ap-southeast-1.amazonaws.com/prod_video/ev_final+(2).mp4'
  }
  let _api = API;
  if (import.meta.env.NODE_ENV === 'production') {
    _api = process.env.NEXT_PUBLIC_API ?? "";
  }

  if (!url) return '';

  if (url.indexOf('https://trainiziprd1.blob.core.windows.net/') === 0) {
    url = url.replace('https://trainiziprd1.blob.core.windows.net/', 'https://trainizicdn1-chctbadndwa4g3c5.z03.azurefd.net/');
  }

  if (url.indexOf('api-v2') == 0) return `https://${url}`;

  // for other hosting
  if (url.indexOf('http') == 0 || url.indexOf('https') == 0) return url;

  // for new implementation
  return `${_api}/asset/video/${url}`;
}

export function getUploadFile(url?: string) {
  let _api = API;
  if (import.meta.env.NODE_ENV === 'production') {
    _api = process.env.NEXT_PUBLIC_API ?? "";
  }

  if (!url) return '';

  // for other hosting
  if (url.indexOf('http') == 0 || url.indexOf('https') == 0) return url;

  // for new implementation
  return `https://d20ypkwyl23eqp.cloudfront.net/${url}`;
}

export function getImage2(url?: string, size: any = 'SM', api?: string) {

  if (!url) return '';

  // for other hosting
  if (url.indexOf('http') == 0 || url.indexOf('https') == 0) return url;

  // for backward compatible
  if (url.indexOf('prod_images') === 0 || url.indexOf('dev_images') === 0 || url.indexOf('images') === 0)
    return `https://d20ypkwyl23eqp.cloudfront.net/${url}`;

  // for new implementation
  return `${api}/asset/image/${url}?size=${size}`;
}
