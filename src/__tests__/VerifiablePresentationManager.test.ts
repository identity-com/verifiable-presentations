import _ from 'lodash';
import { Credential } from '../Credential';
import {
    VerifiablePresentationManager,
    PresentationReference,
    AvailableClaim,
    SearchClaimCriteria,
    Evidence,
    CredentialArtifacts
} from '../VerifiablePresentationManager';
import phoneNumberCredential from './fixtures/phoneNumberCredential.json';
import emailCredential from './fixtures/emailCredential.json';
import unverifiedSSN from './fixtures/UnverifiedSSNCredential.json'
import invalidEmailCredential from './fixtures/invalidEmailCredential.json';
import idDocumentCredential from './fixtures/idDocumentCredential.json';
import idDocumentEvidence from './fixtures/idDocumentSelfieEvidence.json';
import idDocumentPartialCredential from './fixtures/idDocumentPartialCredential.json';
import idDocumentDSR from './fixtures/idDocumentDSR.json';


describe('VerifiablePresentationManager', () => {
    const artifacts = {
        presentations: [
            phoneNumberCredential as Credential,
            emailCredential as Credential
        ]
    };

    const artifactsWithEvidences = {
        presentations: [
            idDocumentCredential as Credential
        ],
        evidences: [
            idDocumentEvidence as Evidence
        ]
    };

    it('should initialize a VerifiablePresentationManager', () => {
        const presentationManager = new VerifiablePresentationManager({});
        expect(presentationManager).toBeDefined();
    });

    it('should add credential artifacts to a verifiable presentation manager and return a status', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const status = await presentationManager.addCredentialArtifacts(artifactsWithEvidences);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(1);
        expect(status.verifiedPresentations).toEqual(1);
        expect(status.totalEvidences).toEqual(1);
        expect(status.verifiedEvidences).toEqual(1);
        done();
    });

    it('should add and verify a partial credential, with a subset of claims', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts = {
            presentations: [
                idDocumentPartialCredential as Credential
            ]
        };
        const status = await presentationManager.addCredentialArtifacts(artifacts);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(1);
        expect(status.verifiedPresentations).toEqual(1);

        const claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(1);
        done();
    });
    
    it('should add and verify a unverified transient', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts = {
            presentations: [
                unverifiedSSN as Credential
            ]
        };
        const status = await presentationManager.addCredentialArtifacts(artifacts);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(1);
        expect(status.verifiedPresentations).toEqual(1);
        
        const claims = await presentationManager.listClaims();
        
        expect(claims).toHaveLength(5);
        done();
    });
    
    

    it('should skip validation on add presentions if skipAddVerify is true', async (done) => {
        const options = {
            skipAddVerify: true
        }
        const presentationManager = new VerifiablePresentationManager(options);

        const status = await presentationManager.addCredentialArtifacts(artifacts);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(2);
        expect(status.verifiedPresentations).toEqual(0);
        done();
    });

    it('should get the list of presentations', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});

        let presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(artifacts);

        presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(2);
        expect(presentations[0].identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(presentations[0].uid).toEqual(phoneNumberCredential.id);
        expect(presentations[1].identifier).toEqual('credential-cvc:Email-v1');
        expect(presentations[1].uid).toEqual(emailCredential.id);
        done();
    });

    it('should get the list of presentations including the unverified if allowGetUnverified is true', async (done) => {
        const options = {
            allowGetUnverified: true,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [invalidEmailCredential as Credential],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(1);
        done();
    });

    it('should get the list of presentations excluding the unverified if allowGetUnverified is false', async (done) => {
        const options = {
            allowGetUnverified: false,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [invalidEmailCredential as Credential],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(0);
        done();
    });

    it('should get the list of evidences', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifactsWithEvidences);

        const evidences = await presentationManager.listEvidences();
        expect(evidences).toEqual([idDocumentEvidence]);
        done();
    });

    it('should get only the list of evidences including unverified if allowGetUnverified is true', async (done) => {
        const options = {
            allowGetUnverified: true,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts = {
            presentations: [
                invalidEmailCredential as Credential
            ],
            evidences: [
                idDocumentEvidence as Evidence
            ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const evidences = await presentationManager.listEvidences();
        expect(evidences).toEqual([idDocumentEvidence]);
        done();
    });

    it('should get a list of evidences filtering by invalid if allowGetUnverified is false (default)', async (done) => {
        const options = {
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts = {
            presentations: [
                invalidEmailCredential as Credential
            ],
            evidences: [
                idDocumentEvidence as Evidence
            ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const evidences = await presentationManager.listEvidences();
        expect(evidences).toHaveLength(0);
        done();
    });

    it('should get the list of all claims', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});

        let claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(artifacts);

        claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + emailCredential.proof.leaves.length
        );
        expect(claims[0].credentialRef.identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(claims[0].identifier).toEqual('claim-cvc:Contact.phoneNumber-v1');
        expect(claims[0].claimPath).toEqual('contact.phoneNumber');
        done();
    });

    it('should get the list of claims from verified presentations only if allowGetUnverified is false', async (done) => {
        const options = {
            allowGetUnverified: false,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [
                invalidEmailCredential as Credential,
                phoneNumberCredential as Credential
            ],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(phoneNumberCredential.proof.leaves.length);
        done();
    });

    it('should get the list of the claims of a presentation', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const presentations = await presentationManager.listPresentations();
        const emailPresentation = _.find(presentations, { identifier: emailCredential.identifier });

        const claims = await presentationManager.listPresentationClaims(emailPresentation as PresentationReference);
        expect(claims).toHaveLength(
            emailCredential.proof.leaves.length
        );
        expect(claims[0].credentialRef.identifier).toEqual(emailCredential.identifier);
        done();
    });

    it('should get an empty list if the presentation is not verified and allowGetUnverified is false', async (done) => {
        const options = {
            allowGetUnverified: false,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [
                invalidEmailCredential as Credential,
            ],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const emailPresentation = {
            identifier: invalidEmailCredential.identifier,
            uid: invalidEmailCredential.id
        };
        const claims = await presentationManager.listPresentationClaims(emailPresentation as PresentationReference);
        expect(claims).toHaveLength(0);
        done();
    });

    it('should get a claim value', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const claims = await presentationManager.listClaims();
        const claimValue = await presentationManager.getClaimValue(claims[0]);

        expect(claimValue).toBeDefined();
        expect(JSON.stringify(phoneNumberCredential.claim)).toEqual(
            expect.stringContaining(JSON.stringify(claimValue))
        );
        done();
    });

    it('should get unverified values if allowGetUnverified is true', async (done) => {
        const options = {
            allowGetUnverified: true,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [
                invalidEmailCredential as Credential,
            ],
        };

        await presentationManager.addCredentialArtifacts(artifacts);
        const claims = await presentationManager.listClaims();
        const claimValue = await presentationManager.getClaimValue(claims[0]);

        expect(claimValue).toBeDefined();
        done();
    });

    it('should get null if requesting a value of a not found claim', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const notFoundClaim = {
            identifier: 'any',
            credentialRef: {
                identifier: 'any',
                uid: 'any'
            },
            claimPath: 'any'
        };

        const claimValue = await presentationManager.getClaimValue(notFoundClaim as AvailableClaim);

        expect(claimValue).toBeNull();
        done();
    });

    it('should return the the available claims that matches the search', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const searchByIdentifierOnly = {
            identifier: 'cvc:Meta:issuanceDate'
        };
        let claims = await presentationManager.findClaims(searchByIdentifierOnly as SearchClaimCriteria);
        expect(claims).toHaveLength(2);

        const searchByIdentifierAndClaimPath = {
            identifier: 'claim-cvc:Email.domain-v1',
            claimPath: 'contact.email.domain'
        };
        claims = await presentationManager.findClaims(searchByIdentifierAndClaimPath as SearchClaimCriteria);
        expect(claims).toHaveLength(1);

        const searchByAll = {
            identifier: 'claim-cvc:Email.domain-v1',
            claimPath: 'contact.email.domain',
            credentialRef: {
                identifier: emailCredential.identifier,
                uid: emailCredential.id
            },
        };
        claims = await presentationManager.findClaims(searchByAll as SearchClaimCriteria);
        expect(claims).toHaveLength(1);
        done();
    });

    it('should return an empty array when there is no matches in claim search', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const criteria = {
            identifier: 'claim-cvc:Email.domain-v1',
            claimPath: 'not.existing.claim.path',
            credentialRef: {
                identifier: emailCredential.identifier,
                uid: emailCredential.id
            },
        };

        const claims = await presentationManager.findClaims(criteria as SearchClaimCriteria);
        expect(claims).toHaveLength(0);
        done();
    });

    it('should only return the searched claims of invalid credential if allowGetUnverified is false', async (done) => {
        const options = {
            allowGetUnverified: false,
            notThrow: true
        };
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [
                invalidEmailCredential as Credential,
                phoneNumberCredential as Credential
            ],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const criteria = {
            identifier: 'cvc:Meta:issuanceDate'
        };

        const claims = await presentationManager.findClaims(criteria as SearchClaimCriteria);
        expect(claims).toHaveLength(1); // only the claim from phone number
        done();
    });

    it('should resolve the key to claim search map by returning a map from key to claim value', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts = {
            presentations: [
                phoneNumberCredential as Credential,
                idDocumentCredential as Credential
            ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const mapping = {
            contact : {
                claimPath: 'contact.phoneNumber.number',
                credentialRef: {
                    identifier: phoneNumberCredential.identifier,
                    uid: phoneNumberCredential.id
                },
            },
            docNumber : {
                claimPath: 'document.number',
            },
            name: {
                identifier: 'claim-cvc:Name.givenNames-v1',
            }
        };

        const mappedClaimValues = await presentationManager.mapClaimValues(mapping);
        expect(mappedClaimValues).toEqual({
            contact: '31988889999',
            docNumber: '9999999999',
            name: 'Civic'
        });
        done();
    });

    it('should return a flat object with claim values if mapClaimValues is called with flatten true', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts = {
            presentations: [
                phoneNumberCredential as Credential,
                idDocumentCredential as Credential
            ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const mapping = {
            contact : {
                claimPath: 'contact.phoneNumber.number',
                credentialRef: {
                    identifier: phoneNumberCredential.identifier,
                    uid: phoneNumberCredential.id
                },
            },
            docNumber : {
                claimPath: 'document.number',
            },
            name: {
                identifier: 'claim-cvc:Name.givenNames-v1',
            }
        };

        const mappedClaimValues = await presentationManager.mapClaimValues(mapping, true);
        expect(mappedClaimValues).toEqual([
            {
                name: 'contact',
                value: '31988889999'
            },
            {
                name: 'docNumber',
                value: '9999999999'
            },
            {
                name: 'name',
                value: 'Civic'
            }
        ]);
        done();
    });

    it('should resolve the key to null if the criteria in the claim map is not matched', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifacts);

        const mapping = {
            docNumber : {
                claimPath: 'document.number.wrong.path',
            }
        };

        const mappedClaimValues = await presentationManager.mapClaimValues(mapping);
        expect(mappedClaimValues).toEqual({
            docNumber: null,
        });
        done();
    });

    it('should resolve the key to the first value if the criteria in the claim map matches multiple claims', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});

        const artifacts = {
            presentations: [
                phoneNumberCredential as Credential,
                phoneNumberCredential as Credential, // duplicated credential
            ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const mapping = {
           contact : {
                claimPath: 'contact.phoneNumber.number',
            }
        };

        const mappedClaimValues = await presentationManager.mapClaimValues(mapping);
        expect(mappedClaimValues).toEqual({
            contact: '31988889999'
        });
        done();
    });

    it('should verify all artifacts and return the total of verified items', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifactsWithEvidences);
        const status = await presentationManager.verifyAllArtifacts();
        expect(status.totalPresentations).toBe(1);
        expect(status.verifiedPresentations).toBe(1);
        expect(status.totalEvidences).toBe(1);
        expect(status.verifiedEvidences).toBe(1);
        done();
    });

    it('should throw exception when adding an invalid credential if notThrow is false (default)', async (done) => {
        const artifacts : CredentialArtifacts = {
            presentations: [invalidEmailCredential as Credential],
        };
        const presentationManager = new VerifiablePresentationManager({});
        expect(presentationManager.addCredentialArtifacts(artifacts)).rejects.toThrow();
        done();
    });

    it('should throw exception when adding an unverified evidence if notThrow is false (default)', async (done) => {
        const artifacts : CredentialArtifacts = {
            presentations: [],
            evidences: [ idDocumentEvidence as Evidence ]
        };
        const presentationManager = new VerifiablePresentationManager({});
        expect(presentationManager.addCredentialArtifacts(artifacts)).rejects.toThrow();
        done();
    });

    it('should not verify an invalid credential and return a status when notThrow is true', async (done) => {
        const options = {
            notThrow: true
        }
        const presentationManager = new VerifiablePresentationManager(options);
        const artifacts : CredentialArtifacts = {
            presentations: [invalidEmailCredential as Credential],
        };
        await presentationManager.addCredentialArtifacts(artifacts);
        const status = await presentationManager.verifyAllArtifacts();

        expect(status.totalPresentations).toBe(1);
        expect(status.verifiedPresentations).toBe(0);
        done();
    });

    it('should consider an evidence invalid when there is not a valid credential referencing it', async (done) => {
        const options = {
            notThrow: true
        }
        const presentationManager = new VerifiablePresentationManager(options);
        const artifacts : CredentialArtifacts = {
            presentations: [],
            evidences: [ idDocumentEvidence as Evidence ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const status = await presentationManager.verifyAllArtifacts();
        expect(status.totalEvidences).toBe(1);
        expect(status.verifiedEvidences).toBe(0);
        done();
    });

    it('should consider an evidence invalid if the base64Encoded hash does not match the sha256 value', async (done) => {
        const options = {
            notThrow: true
        }
        const presentationManager = new VerifiablePresentationManager(options);

        const invalidEvidence = _.cloneDeep(idDocumentEvidence);
        invalidEvidence.base64Encoded = _.replace(invalidEvidence.base64Encoded, /=$/, 'extra-str=');

        const artifacts : CredentialArtifacts = {
            presentations: [ idDocumentCredential as Credential ],
            evidences: [ invalidEvidence as Evidence ]
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const status = await presentationManager.verifyAllArtifacts();
        expect(status.totalEvidences).toBe(1);
        expect(status.verifiedEvidences).toBe(0);
        done();
    });

    it('should return true if all artifacts is verified', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        await presentationManager.addCredentialArtifacts(artifactsWithEvidences);

        const isAllVerified = await presentationManager.isAllArtifactsVerified();
        expect(isAllVerified).toBeTruthy();
        done();
    });

    it('should return false if not all artifacts is verified', async (done) => {
        const options = {
            notThrow: true
        }
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [invalidEmailCredential as Credential],
        };
        await presentationManager.addCredentialArtifacts(artifacts);

        const isAllVerified = await presentationManager.isAllArtifactsVerified();
        expect(isAllVerified).toBeFalsy();
        done();
    });

    it('should purge the invalid artifacts', async (done) => {
        const options = {
            notThrow: true
        }
        const presentationManager = new VerifiablePresentationManager(options);

        const artifacts : CredentialArtifacts = {
            presentations: [
                phoneNumberCredential as Credential,
                invalidEmailCredential as Credential
            ],
            evidences: [ idDocumentEvidence as Evidence ]
        };
        const statusBefore = await presentationManager.addCredentialArtifacts(artifacts);
        expect(statusBefore.totalPresentations).toBe(2);
        expect(statusBefore.totalEvidences).toBe(1);

        const statusAfterPurge = await presentationManager.purgeInvalidArtifacts();
        expect(statusAfterPurge.totalPresentations).toBe(1);
        expect(statusAfterPurge.totalEvidences).toBe(0);

        const presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(1);

        const evidences = await presentationManager.listEvidences();
        expect(evidences).toHaveLength(0);

        const claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(phoneNumberCredential.proof.leaves.length);
        done();
    });

    it('should verifiy if a presentation was granted for a specific dsr', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts : CredentialArtifacts = {
            presentations: [idDocumentCredential as Credential]
        };
        await presentationManager.addCredentialArtifacts(artifacts);
        const presentations = await presentationManager.listPresentations();

        const wasGranted = presentationManager.wasGrantedForDSR(presentations[0], JSON.stringify(idDocumentDSR));
        expect(wasGranted).toBeTruthy();
        done();
    });

    it('should fail grant verification if a credential is tested with a dsr not used to request it', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts : CredentialArtifacts = {
            presentations: [phoneNumberCredential as Credential]
        };
        await presentationManager.addCredentialArtifacts(artifacts);
        const presentations = await presentationManager.listPresentations();

        const phoneCredential = presentations[0];

        const wasGranted = presentationManager.wasGrantedForDSR(phoneCredential, JSON.stringify(idDocumentDSR));
        expect(wasGranted).toBeFalsy();
        done();
    });

    it('should fail grant verification if a credential is tested with an invalid dsr string', async (done) => {
        const presentationManager = new VerifiablePresentationManager({});
        const artifacts : CredentialArtifacts = {
            presentations: [phoneNumberCredential as Credential]
        };
        await presentationManager.addCredentialArtifacts(artifacts);
        const presentations = await presentationManager.listPresentations();

        const invalidDsr = '{}';
        const wasGranted = presentationManager.wasGrantedForDSR(presentations[0], invalidDsr);
        expect(wasGranted).toBeFalsy();
        done();
    });
});
