import picgo from 'picgo'

export = (ctx: picgo) => {
  const register = () => {
    ctx.helper.uploader.register('cloudflare-r2', {
      handle (ctx) {
        console.log(ctx)
      }
    })
  }
  return {
    uploader: 'cloudflare-r2',
    register
  }
}
