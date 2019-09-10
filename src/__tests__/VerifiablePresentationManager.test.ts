import * as _ from 'lodash';
import {
    Credential,
    VerifiablePresentationManager,
    PresentationReference
} from '../VerifiablePresentationManager';
import phoneNumberCredential from './fixtures/phoneNumberCredential.json';
import emailCredential from './fixtures/emailCredential.json';

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
});
