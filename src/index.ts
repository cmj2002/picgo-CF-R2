import picgo from 'picgo'
import { IPluginConfig } from 'picgo/dist/src/utils/interfaces'
import path from 'path'
import crypto from 'crypto'
import moment from 'moment'

function handleError(err: any, ctx: picgo) {
  ctx.log.error('Cloudflare R2 uploader error: ' + JSON.stringify(err))
  ctx.emit('notification', {
    title: '上传失败！',
    body: JSON.stringify(err)
  })
  throw err;
}

interface Options {
  remoteUrl: string,
  secret: string,
  uploadPath: string
}

async function handle(ctx: picgo) {
  const userConfig: Options = ctx.getConfig('picBed.cloudflare');
  if (!userConfig) {
    handleError("config not found!", ctx);
    return ctx;
  } else if (!userConfig.remoteUrl || !userConfig.uploadPath || !userConfig.secret) {
    handleError("config invalid!", ctx);
    return ctx;
  }
  try {
    let imgList = ctx.output;
    const remoteUrl = userConfig.remoteUrl;
    const uploadPath = userConfig.uploadPath;
    // time string: yyyy/mm/ddHHMMss
    const timeString = moment().format('YYYY/MM/DDHHmmss');
    for (let i in imgList) {
      if (!imgList.hasOwnProperty(i)) continue
      let image = imgList[i].buffer
      if (!image && imgList[i].base64Image) {
        image = Buffer.from(imgList[i].base64Image, 'base64')
      }
      const targetPath = `${uploadPath}${timeString}${i}${path.extname(imgList[i].fileName)}`
      const dateHeader = new Date().toUTCString();
      // auth=sha256(date+targetPath+secret)
      const toHash= `${dateHeader}${targetPath}${userConfig.secret}`
      const auth = crypto.createHash('sha256').update(toHash).digest('hex');
      const res = await ctx.request({
        method: 'put',
        uri: `${remoteUrl}${targetPath}`,
        body: image,
        resolveWithFullResponse: true,
        headers: {
          "Authorization": `Bearer ${auth}`,
          "Date": dateHeader,
          "Content-Type": "application/octet-stream",
          "Content-Length": image.length
        }
      })
      if (res.statusCode === 200) {
        delete imgList[i].base64Image
        delete imgList[i].buffer
        const body = JSON.parse(res.body);
        const url = body['url']
        imgList[i].imgUrl = url;
        imgList[i].url=url;
      }else{
        handleError(`status code: ${res.statusCode} with message: ${res.body}`, ctx)
        return ctx;
      }
    }
  } catch (err) {
    handleError(err, ctx);
    return ctx;
  }
}

const config = (ctx: picgo): IPluginConfig[] => {
  let userConfig: Options = ctx.getConfig('picBed.cloudflare');
  return [
    {
      name: 'remoteUrl',
      type: 'input',
      default: userConfig?.remoteUrl || '',
      message: "remote URL(Don't miss https:// at begining or / at the end)",
      required: true
    },
    {
      name: 'secret',
      type: 'password',
      default: userConfig?.secret || '',
      message: "Secret",
      required: true
    },
    {
      name: 'uploadPath',
      type: 'input',
      default: userConfig?.uploadPath || '/',
      required: true,
      message: "Upload path(Should be contained in ALLOW_PATHS)"
    }
  ];
}


export = (ctx: picgo) => {
  const register = () => {
    ctx.helper.uploader.register('cloudflare', {
      handle,
      name: "Cloudflare R2",
      config
    })
  }
  return {
    uploader: 'cloudflare',
    register
  }
}
