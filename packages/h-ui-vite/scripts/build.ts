console.log('====start to build:all =====')

import * as fs from 'fs-extra'
import * as path from 'path'
import { config } from '../vite.config'
import { build, InlineConfig, defineConfig, UserConfig } from 'vite'
const buildAll = async () => {
    // const inline: InlineConfig =
    //   viteConfig;

    // 全量打包 build:entry
    // await build(defineConfig(config as UserConfig) as InlineConfig)
    await build()

    const baseOutDir = config!.build!.outDir as string

    // 复制 Package.json 文件
    const packageJson = require('../package.json')
    packageJson.main = 'h-ui.umd.js'
    packageJson.module = 'h-ui.esm.js'
    packageJson.types = 'h-ui.d.ts'
    fs.outputFile(
        path.resolve(baseOutDir, `package.json`),
        JSON.stringify(packageJson, null, 2)
    )

    // 拷贝 README.md文件
    // fs.copyFileSync(
    //     path.resolve('./README.md'),
    //     path.resolve(baseOutDir + '/README.md')
    // )

    // 生成配置DTS配置文件入口
    // generateDTS(path.resolve(config.build.outDir, `smarty-ui.esm.js`))

    // 各个组件分别打包
    console.log('===build:split===')
    const srcDir = path.resolve(__dirname, '../src/')
    const componentsDir = fs.readdirSync(srcDir).filter((name: string) => {
        // 只要目录不要文件，且里面包含index.ts
        const componentDir = path.resolve(srcDir, name)
        const isDir = fs.lstatSync(componentDir).isDirectory()
        return isDir && fs.readdirSync(componentDir).includes('index.ts')
    })
    console.log('===识别到的组件有:', componentsDir)
    // forEach中异步执行有问题 改为for-of
    for (let name of componentsDir) {
        console.log(`===开始打包组件: ${name}`)
        const outDir = path.resolve(baseOutDir, name)
        const customBuildOptions = {
            lib: {
                entry: path.resolve(srcDir, name),
                formats: [`es`],
                fileName: (fmt: string, entryName: string) => {
                    return `index.${fmt}.js`
                }, // 导出的模块格式
                name, // 导出模块名
            },
            outDir,
        }

        Object.assign(config.build as any, customBuildOptions)
        console.log(config)
        console.log(config.build!.lib!.formats)
        await build(defineConfig(config as UserConfig) as InlineConfig)

        fs.outputFile(
            path.resolve(outDir, `package.json`),
            `{
                "name": "@my-h-ui/h-ui/${name}",
                "main": "index.umd.js",
                "module": "index.umd.js"
            }`,
            `utf-8`
        )
    }
}

buildAll()