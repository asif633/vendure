/* tslint:disable:no-console */
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { ADMIN_API_PATH, API_PORT, SHOP_API_PATH } from '@vendure/common/lib/shared-constants';
import { DefaultLogger, DefaultSearchPlugin, examplePaymentHandler, LogLevel, VendureConfig } from '@vendure/core';
import { ElasticsearchPlugin } from '@vendure/elasticsearch-plugin';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import path from 'path';
import { ConnectionOptions } from 'typeorm';

/**
 * Config settings used during development
 */
export const devConfig: VendureConfig = {
    authOptions: {
        disableAuth: false,
        sessionSecret: 'some-secret',
        requireVerification: true,
    },
    port: API_PORT,
    adminApiPath: ADMIN_API_PATH,
    shopApiPath: SHOP_API_PATH,
    dbConnectionOptions: {
        synchronize: false,
        logging: false,
        ...getDbConfig(),
    },
    paymentOptions: {
        paymentMethodHandlers: [examplePaymentHandler],
    },
    customFields: {},
    logger: new DefaultLogger({ level: LogLevel.Verbose }),
    importExportOptions: {
        importAssetsDir: path.join(__dirname, 'import-assets'),
    },
    plugins: [
        new AssetServerPlugin({
            route: 'assets',
            assetUploadDir: path.join(__dirname, 'assets'),
            // assetUploadDir: path.join(__dirname, '../../../../kbart/artsupplies-vendure/server/vendure/assets'),
            port: 5002,
        }),
        new DefaultSearchPlugin(),
        // new ElasticsearchPlugin({
        //     host: 'http://192.168.99.100',
        //     port: 9200,
        // }),
        new EmailPlugin({
            devMode: true,
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../email-plugin/templates'),
            outputPath: path.join(__dirname, 'test-emails'),
            mailboxPort: 5003,
            globalTemplateVars: {
                verifyEmailAddressUrl: 'http://localhost:4201/verify',
                passwordResetUrl: 'http://localhost:4201/reset-password',
                changeEmailAddressUrl: 'http://localhost:4201/change-email-address',
            },
        }),
        new AdminUiPlugin({
            port: 5001,
        }),
    ],
};

function getDbConfig(): ConnectionOptions {
    const dbType = process.env.DB || 'mysql';
    switch (dbType) {
        case 'postgres':
            console.log('Using postgres connection');
            return {
                synchronize: true,
                type: 'postgres',
                host: '127.0.0.1',
                port: 5432,
                username: 'postgres',
                password: 'Be70',
                database: 'vendure',
            };
        case 'sqlite':
            console.log('Using sqlite connection');
            return {
                type: 'sqlite',
                database:  path.join(__dirname, 'vendure.sqlite'),
            };
        case 'sqljs':
            console.log('Using sql.js connection');
            return {
                type: 'sqljs',
                autoSave: true,
                database: new Uint8Array([]),
                location: path.join(__dirname, 'vendure.sqlite'),
            };
        case 'mysql':
        default:
            console.log('Using mysql connection');
            return {
                synchronize: true,
                type: 'mysql',
                host: '192.168.99.100',
                port: 3306,
                username: 'root',
                password: '',
                database: 'vendure-dev',
            };
    }
}
