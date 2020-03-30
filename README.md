# verifiable-presentations
Utility Library to securely handle verifiable presentations.

[![CircleCI](https://circleci.com/gh/identity-com/verifiable-presentations.svg?style=svg)](https://circleci.com/gh/identity-com/verifiable-presentations)

Verifiable-presentations provides methods to run operations over a collection of verifiable credentials and evidences, such as query for credential identifiers, search for claims, fetch claim values, and non-cryptographically and cryptographically secure verify the data against the proofs.

[Documentation](https://identity-com.github.io/verifiable-presentations/)

Usage example:

```
import { secureRedundantManager } from '@identity.com/verifiable-presentations';

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

## PIIFactory

A class to allow easy extractiion of PII from a DSR Response based on a specific dsrRequest implementation, with a given mapping and formatters specific to that DSR. It also allows generating a new Scope Request based on unique URL generation.

```
const mapping = {
  first_name: { identifier: 'claim-cvc:Name.givenNames-v1' },
  last_name: { identifier: 'claim-cvc:Name.familyNames-v1' },
  date_of_birth: { identifier: 'claim-cvc:Document.dateOfBirth-v1' },
  street: { identifier: 'claim-cvc:Identity.address-v1' },
};
const formatters = {
  street: { format: claimValue => `${claimValue.street} ${claimValue.unit}` },
  date_of_birth: { format: claimValue => `${claimValue.year}-${claimValue.month}-${claimValue.day}` },
};

const piiFactory = new PIIFactory(dsrRequest, mapping, formatters);

const eventsURL = 'https://testEvents';
const idvDid = 'did:ethr:0x1a88a35421a4a0d3e13fe4e8ebcf18e9a249dc5a';
const dsrResolver = {
    id: '123',
    // key pair generated purely for this test
    signingKeys: {
    xpub: '0414a08b13afa8d33c499ec828065775915ddf0301634d35e26c6cec4ad0f0f2b72c79e90357d47c7ba65a3c03bb22ac7e273c5d01494448a155df8a28da33b48d',
    xprv: 'a4947aa34ce507e995a60a455582d97f3fd1163eba3dd990ea1541a8fa049828',
    },
};
const urlGeneratorFn = evidenceName => `https://<test cloud provider>/<unique Id>/${evidenceName}.json`;


// generate a DSR
const dsr = await piiFactory.generateDSR(eventsURL, idvDid, dsrResolver, urlGeneratorFn);

// extract PII from a DSR response
const extractedPII = await piiFactory.extractPII(dsrResponse);

```

For more detailed working examples, please, refer to the tests in [`index.test.ts`](src/__tests__/index.test.ts).
