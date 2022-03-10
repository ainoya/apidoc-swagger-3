const fs = require('fs')
const path = require('path')
const apidoc = require('apidoc-core')
const winston = require('winston');
const yaml = require('js-yaml')

const apidoc_to_swagger = require('./apidoc_to_swagger');
const libPkg = require('./package.json');

apidoc.setGeneratorInfos({ name: libPkg.name, time: new Date(), version: libPkg.version, url: libPkg.repository.url })


function generateLog(options) {
    return winston.createLogger({
        transports: [
            new (winston.transports.Console)({
                level: options.verbose ? 'verbose' : 'info',
                silent: false,
                prettyPrint: true,
                colorize: options.color,
                timestamp: false
            }),
        ]
    })
}

function main(options) {
    options.verbose && console.log('options', options);
    const log = generateLog(options)
    const { src, dest, verbose } = options
    apidoc.setLogger(log)

    var api = apidoc.parse({ ...options, log: log })
    if (api === true) {
        console.log('No input data found, check your include/exclude filters');
        return;
    }

    var apidocData = JSON.parse(api.data);
    var projectData = JSON.parse(api.project);

    const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)

    api["swaggerData"] = swagger;
    createOutputFile(api.swaggerData, log, options)

    return swagger;
}

function createOutputFile(swaggerData, log, options) {
    if (options.simulate)
        log.warn('!!! Simulation !!! No file or dir will be copied or created.');

    log.verbose('Creating dir: ' + app.options.dest);
    if (!app.options.simulate)
        fs.existsSync(app.options.dest) || fs.mkdirSync(app.options.dest);

    log.verbose('Writing JSON swagger file: ' + app.options.dest + 'swagger.json');
    if (!app.options.simulate)
        fs.writeFileSync(app.options.dest + './swagger.json', JSON.stringify(api.swaggerData, null, 4));

    log.verbose('Writing YAML swagger file: ' + app.options.dest + 'swagger.yaml');
    if (!app.options.simulate)
        fs.writeFileSync(app.options.dest + './swagger.yaml', yaml.dump(api.swaggerData));
}

exports.main = main
