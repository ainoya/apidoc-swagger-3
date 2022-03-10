const fs = require('fs')
const path = require('path')
const apidoc = require('apidoc')
const winston = require('winston');
const yaml = require('js-yaml')

const apidoc_to_swagger = require('./apidoc_to_swagger');


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

    var api = apidoc.createDoc({ ...options, log: log })
    if (api === true) {
        console.log('No input data found, check your include/exclude filters');
        return;
    }

    var apidocData = JSON.parse(api.data);
    // Replicate underscoreToSpace handlebar filter from https://github.com/apidoc/apidoc/blob/0.50.5/template/src/hb_helpers.js#L93
    for (let article of apidocData) {
        if (article.name)
            article.name = article.name.replace(/(_+)/g, ' ');
    }
    var projectData = JSON.parse(api.project);

    const swagger = apidoc_to_swagger.toSwagger(apidocData, projectData)

    api["swaggerData"] = swagger;
    createOutputFiles(api.swaggerData, log, options)

    return swagger;
}

function createOutputFiles(swaggerData, log, options) {
    log.verbose('Creating dir: ' + options.dest);
    if (!options.dryRun)
        fs.existsSync(options.dest) || fs.mkdirSync(options.dest);

    log.verbose('Writing JSON swagger file: ' + options.dest + 'swagger.json');
    if (!options.dryRun)
        fs.writeFileSync(options.dest + './swagger.json', JSON.stringify(swaggerData, null, 4));

    log.verbose('Writing YAML swagger file: ' + options.dest + 'swagger.yaml');
    if (!options.dryRun)
        fs.writeFileSync(options.dest + './swagger.yaml', yaml.dump(swaggerData));
}

exports.main = main
