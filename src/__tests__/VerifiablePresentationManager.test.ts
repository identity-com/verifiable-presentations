import * as _ from 'lodash';
import { Credential } from '../Credential';
import {
    VerifiablePresentationManager,
    PresentationReference,
    AvailableClaim,
    SearchClaimCriteria,
    Evidence
} from '../VerifiablePresentationManager';
import phoneNumberCredential from './fixtures/phoneNumberCredential.json';
import emailCredential from './fixtures/emailCredential.json';

const sampleEvidence = {
    content: 'selfie',
    contentType: 'image/jpeg',
    sha256: 'sha256-hash-value',
    base64Encoded: 'base64-encoded-value'
};


describe('VerifiablePresentationManager', () => {
    const options = {
        skipAddVerify: true,
        skipGetVerify: true,
        allowGetUnverified: true,
        allowListUnverified: true,
        allowMocks: true,
        notThrow: true,
    };

    const credentialArtifacts = {
        presentations: [
            phoneNumberCredential as Credential,
            emailCredential as Credential
        ],
        evidences: [
            sampleEvidence as Evidence
        ]
    };

    it('should initialize a VerifiablePresentationManager', () => {
        const presentationManager = new VerifiablePresentationManager(options);
        expect(presentationManager).toBeDefined();
    });

    it('should add credential artifacts to a verifiable presentation manager and return a status', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        const status = await presentationManager.addCredentialArtifacts(credentialArtifacts);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(2);
        expect(status.totalEvidences).toEqual(1);
        done();
    });

    it('should get the list of presentations', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);

        let presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(2);
        expect(presentations[0].identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(presentations[0].uid).toEqual(phoneNumberCredential.id);
        expect(presentations[1].identifier).toEqual('credential-cvc:Email-v1');
        expect(presentations[1].uid).toEqual(emailCredential.id);
        done();
    });

    it('should get the list of evidences', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        const evidences = await presentationManager.listEvidences();
        expect(evidences).toEqual([sampleEvidence]);true
        done();
    });

    it('should get the list of all claims', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);

        let claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + emailCredential.proof.leaves.length
        );
        expect(claims[0].credentialRef.identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(claims[0].identifier).toEqual('claim-cvc:Contact.phoneNumber-v1');
        expect(claims[0].claimPath).toEqual('contact.phoneNumber');
        done();
    });

    it('should get the list of the claims of a presentation', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        const presentations = await presentationManager.listPresentations();
        const emailPresentation = _.find(presentations, { identifier: emailCredential.identifier });

        const claims = await presentationManager.listPresentationClaims(emailPresentation as PresentationReference);
        expect(claims).toHaveLength(
            emailCredential.proof.leaves.length
        );
        expect(claims[0].credentialRef.identifier).toEqual(emailCredential.identifier);
        done();
    });

    it('should get a claim value', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        const claims = await presentationManager.listClaims();
        const claimValue = await presentationManager.getClaimValue(claims[0]);

        expect(claimValue).toBeDefined();
        expect(JSON.stringify(phoneNumberCredential.claim)).toEqual(
            expect.stringContaining(JSON.stringify(claimValue))
        );
        done();
    });

    it('should get null if requesting a value of a not found claim', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

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
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

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
        const presentationManager = new VerifiablePresentationManager(options);
        await presentationManager.addCredentialArtifacts(credentialArtifacts);

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
});
