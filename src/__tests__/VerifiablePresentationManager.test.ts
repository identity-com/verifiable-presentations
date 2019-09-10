import { VerifiablePresentationManager } from '../VerifiablePresentationManager';
import sampleCredential from './fixtures/credential.json';

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
        presentations: [sampleCredential]
    };

    it('should initialize a VerifiablePresentationManager', () => {
        const presentationManager = new VerifiablePresentationManager(options);
        expect(presentationManager).toBeDefined();
    });

    it('should add credential artifacts to a verifiable presentation manager and return a status', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);
        const status = await presentationManager.addCredentialArtifacts(credentialArtifacts);
        expect(status).toBeDefined();
        expect(status.totalPresentations).toEqual(1);
        done();
    });

    it('should get the list of presentations', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);

        let presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        presentations = await presentationManager.listPresentations();
        expect(presentations).toHaveLength(1);
        expect(presentations[0].identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(presentations[0].uid).toEqual(sampleCredential.id);
        done();
    });

    it('should get the list of claims', async (done) => {
        const presentationManager = new VerifiablePresentationManager(options);

        let claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(0);

        await presentationManager.addCredentialArtifacts(credentialArtifacts);

        claims = await presentationManager.listClaims();
        expect(claims).toHaveLength(sampleCredential.proof.leaves.length);
        expect(claims[0].credentialRef.identifier).toEqual('credential-cvc:PhoneNumber-v1');
        expect(claims[0].identifier).toEqual('claim-cvc:Contact.phoneNumber-v1');
        expect(claims[0].claimPath).toEqual('contact.phoneNumber');
        done();
    });
});
