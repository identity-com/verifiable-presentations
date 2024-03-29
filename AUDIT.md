This project uses [npm audit](https://docs.npmjs.com/cli/audit) to scan dependencies for vulnerabilities
and automatically install any compatible updates to vulnerable dependencies.
The security audit is also integrated into the project's CI pipeline via [audit-ci](https://github.com/IBM/audit-ci) command
which fails the build if there is any vulnerability found.
It is possible to ignore specific errors by whitelisting them in [audit-ci config.](./audit-ci.json).

## NPM audit whitelist
Whenever you whitelist a specific advisory it is required to refer it to here and justify the whitelisting.

### Advisories

| #       | Level    | Module        | Title                                                                    | Explanation                                                                                                                  |
|---------|----------|---------------|--------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| 1085318 | critical | flat | flat vulnerable to Prototype Pollution | @identity.com/credential-commons, @identity.com/uca |
| 1086450 | moderate | highlight.js | ReDOS vulnerabities: multiple grammars | node_modules/highlight.js |
| 1085550 | high | marked | Inefficient Regular Expression Complexity in marked | [node_modules/highlight.js](https://github.com/advisories/GHSA-5v2h-r2cx-5xgj) |