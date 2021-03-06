import { build } from 'esbuild';
import config from './config.js';
import dotenv from 'dotenv';
import { parseAsEnvs } from 'esbuild-env-parsing';

dotenv.config({});

(() =>
    build({
        ...config({
            entryPoint: 'src/scrapper/scrap.ts',
            outfile: 'build/scrap.js',
        }),
        define: parseAsEnvs([
            'NODE_ENV',
            'PGUSER',
            'PGHOST',
            'PGDATABASE',
            'PGPASSWORD',
            'PGPORT',
            'MAPS_API_KEY',
        ]),
    })
        .then((r) => {
            console.dir(r);
            console.log('Build succeeded');
        })
        .catch((e) => {
            console.log('Error building:', e.message);
            process.exit(1);
        }))();
