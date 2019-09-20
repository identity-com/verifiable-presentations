# verifiable-presentations
Utility Library to securely handle verifiable presentations.

[![CircleCI](https://circleci.com/gh/identity-com/verifiable-presentations.svg?style=svg)](https://circleci.com/gh/identity-com/verifiable-presentations)

Verifiable-presentations provides methods to run operations over a collection of verifiable credentials and evidences, such as query for credential identifiers, search for claims, feth claim value, and non-cryptographically and cryptographically secure verify the data against the proofs.

[Documentation](https://identity-com.github.io/verifiable-presentations/)

Usage example:

```
import { secureRedundantManager } from '../index';

const artifacts = {
    presentations: [
        emailCredentialJson,
        phoneNumberCredentialJson,
        idDocumentCredentialJson
    ],
    evidences: [
        idDocumentEvidence
    ]
} as CredentialArtifacts;

let status = await secureRedundantManager.addCredentialArtifacts(artifacts);

status = await presentationManager.verifyAllArtifacts();

status = await presentationManager.purgeInvalidArtifacts();

const presentations = await secureRedundantManager.listPresentations();

const evidences = await secureRedundantManager.listEvidences();

let claims = await presentationManager.listClaims();

claims = await presentationManager.listPresentationClaims(presentations[0]);

const criteria = {
    claimPath: 'contact.phoneNumber.countryCode'

}
claims = await presentationManager.findClaims(criteria);

const claimValue = await presentationManager.getClaimValue(claims[0]);
```

For more detailed working examples, please, refer to the tests in [`index.test.ts`](src/__tests__/index.test.ts).
