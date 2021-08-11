import {
  VerifiablePresentationManagerFactory
} from '../index';
import {
    CredentialArtifacts
} from '../VerifiablePresentationManager';
import phoneNumberCredential from './fixtures/phoneNumberCredential.json';
import invalidEmailCredential from './fixtures/invalidEmailCredential.json';
import idDocumentCredential from './fixtures/idDocumentCredential.json';
import idDocumentEvidence from './fixtures/idDocumentSelfieEvidence.json';

import { schemaLoader, CVCSchemaLoader } from '@identity.com/credential-commons';

schemaLoader.addLoader(new CVCSchemaLoader());

describe('Index', () => {
    it('should perform a validation on every operation with a secure redundant presentation manager', async () => {
        const artifacts = {
            presentations: [
                phoneNumberCredential,
                idDocumentCredential
            ],
            evidences: [
                idDocumentEvidence
            ]
        } as CredentialArtifacts;

        // should validate presentations when adding
        const secureRedundantManager = VerifiablePresentationManagerFactory.createSecureRedundantManager();
        const status = await secureRedundantManager.addCredentialArtifacts(artifacts);
        expect(status.totalPresentations).toEqual(2);
        expect(status.totalEvidences).toEqual(1);
        expect(status.verifiedPresentations).toEqual(2);
        expect(status.verifiedEvidences).toEqual(1);

        const invalidArtifacts = {
            presentations: [
                invalidEmailCredential
            ]
        } as CredentialArtifacts;

        // should throw an exception if there is any invalid credential on add
        await expect(secureRedundantManager.addCredentialArtifacts(invalidArtifacts)).rejects.toThrow();

        // should throw an exception if there is any invalid credential on read
        await expect(secureRedundantManager.listPresentations()).rejects.toThrow();

        const statusAfterPurge = await secureRedundantManager.purgeInvalidArtifacts();
        expect(statusAfterPurge).toEqual(status);

        const presentations = await secureRedundantManager.listPresentations();
        expect(presentations).toHaveLength(2);

        const evidences = await secureRedundantManager.listEvidences();
        expect(evidences).toHaveLength(1);

        const claims = await secureRedundantManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + idDocumentCredential.proof.leaves.length
        );

        const presentationClaims = await secureRedundantManager.listPresentationClaims(presentations[0]);
        expect(presentationClaims).toHaveLength(
            phoneNumberCredential.proof.leaves.length
        );

        const claimValue = await secureRedundantManager.getClaimValue(claims[0]);
        expect(claimValue).toBeDefined();


    });

    it('should perform a validation on every READ operation with a secure fast ingest manager', async () => {
        const artifacts = {
            presentations: [
                phoneNumberCredential,
                idDocumentCredential
            ],
            evidences: [
                idDocumentEvidence
            ]
        } as CredentialArtifacts;

        // should NOT validate presentations when adding
        const secureFastIngestManager = VerifiablePresentationManagerFactory.createSecureFastIngestManager();
        const status = await secureFastIngestManager.addCredentialArtifacts(artifacts);
        expect(status.totalPresentations).toEqual(2);
        expect(status.totalEvidences).toEqual(1);
        expect(status.verifiedPresentations).toEqual(0);
        expect(status.verifiedEvidences).toEqual(0);

        const invalidArtifacts = {
            presentations: [
                invalidEmailCredential
            ]
        } as CredentialArtifacts;

        // should NOT validate presentations when adding
        const statusAfterInvalid = await secureFastIngestManager.addCredentialArtifacts(invalidArtifacts);
        expect(statusAfterInvalid.totalPresentations).toEqual(3);
        expect(statusAfterInvalid.totalEvidences).toEqual(1);
        expect(statusAfterInvalid.verifiedPresentations).toEqual(0);
        expect(statusAfterInvalid.verifiedEvidences).toEqual(0);

        // should throw an exception if there is any invalid credential on read
        await expect(secureFastIngestManager.listPresentations()).rejects.toThrow();

        const statusAfterPurge = await secureFastIngestManager.purgeInvalidArtifacts();
        expect(statusAfterPurge).toEqual(status);

        const presentations = await secureFastIngestManager.listPresentations();
        expect(presentations).toHaveLength(2);

        const evidences = await secureFastIngestManager.listEvidences();
        expect(evidences).toHaveLength(1);

        const claims = await secureFastIngestManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + idDocumentCredential.proof.leaves.length
        );

        const presentationClaims = await secureFastIngestManager.listPresentationClaims(presentations[0]);
        expect(presentationClaims).toHaveLength(
            phoneNumberCredential.proof.leaves.length
        );

        const claimValue = await secureFastIngestManager.getClaimValue(claims[0]);
        expect(claimValue).toBeDefined();


    });

    it('should perform a validation on every ADD operation with a secure fast read manager', async () => {
        const artifacts = {
            presentations: [
                phoneNumberCredential,
                idDocumentCredential
            ],
            evidences: [
                idDocumentEvidence
            ]
        } as CredentialArtifacts;

        // should validate presentations when adding
        const secureFastReadManager = VerifiablePresentationManagerFactory.createSecureFastReadManager();
        const status = await secureFastReadManager.addCredentialArtifacts(artifacts);
        expect(status.totalPresentations).toEqual(2);
        expect(status.totalEvidences).toEqual(1);
        expect(status.verifiedPresentations).toEqual(2);
        expect(status.verifiedEvidences).toEqual(1);

        const invalidArtifacts = {
            presentations: [
                invalidEmailCredential
            ]
        } as CredentialArtifacts;

        // should throw an exception if there is any invalid credential on add
        await expect(secureFastReadManager.addCredentialArtifacts(invalidArtifacts)).rejects.toThrow();

        // should not validate credentials when reading
        const presentationsWithInvalid = await secureFastReadManager.listPresentations();
        expect(presentationsWithInvalid).toHaveLength(3);

        const statusAfterPurge = await secureFastReadManager.purgeInvalidArtifacts();
        expect(statusAfterPurge).toEqual(status);

        const presentations = await secureFastReadManager.listPresentations();
        expect(presentations).toHaveLength(2);

        const evidences = await secureFastReadManager.listEvidences();
        expect(evidences).toHaveLength(1);

        const claims = await secureFastReadManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + idDocumentCredential.proof.leaves.length
        );

        const presentationClaims = await secureFastReadManager.listPresentationClaims(presentations[0]);
        expect(presentationClaims).toHaveLength(
            phoneNumberCredential.proof.leaves.length
        );

        const claimValue = await secureFastReadManager.getClaimValue(claims[0]);
        expect(claimValue).toBeDefined();


    });

    it('should skip validation for all ADD or GET operations with an insecure manager', async () => {
        const artifacts = {
            presentations: [
                phoneNumberCredential,
                idDocumentCredential
            ],
            evidences: [
                idDocumentEvidence
            ]
        } as CredentialArtifacts;

        // should NOT validate presentations when adding
        const insecureManager = VerifiablePresentationManagerFactory.createInsecureManager();
        const status = await insecureManager.addCredentialArtifacts(artifacts);
        expect(status.totalPresentations).toEqual(2);
        expect(status.totalEvidences).toEqual(1);
        expect(status.verifiedPresentations).toEqual(0);
        expect(status.verifiedEvidences).toEqual(0);

        const invalidArtifacts = {
            presentations: [
                invalidEmailCredential
            ]
        } as CredentialArtifacts;

        // should NOT validate presentations when adding
        const statusAfterInvalid = await insecureManager.addCredentialArtifacts(invalidArtifacts);
        expect(statusAfterInvalid.totalPresentations).toEqual(3);
        expect(statusAfterInvalid.totalEvidences).toEqual(1);
        expect(statusAfterInvalid.verifiedPresentations).toEqual(0);
        expect(statusAfterInvalid.verifiedEvidences).toEqual(0);

        // should NOT validate credentials when reading
        const presentationsWithInvalid = await insecureManager.listPresentations();
        expect(presentationsWithInvalid).toHaveLength(3);

        const statusAfterPurge = await insecureManager.purgeInvalidArtifacts();
        expect(statusAfterPurge).toEqual(status);

        const presentations = await insecureManager.listPresentations();
        expect(presentations).toHaveLength(2);

        const evidences = await insecureManager.listEvidences();
        expect(evidences).toHaveLength(1);

        const claims = await insecureManager.listClaims();
        expect(claims).toHaveLength(
            phoneNumberCredential.proof.leaves.length + idDocumentCredential.proof.leaves.length
        );

        const presentationClaims = await insecureManager.listPresentationClaims(presentations[0]);
        expect(presentationClaims).toHaveLength(
            phoneNumberCredential.proof.leaves.length
        );

        const claimValue = await insecureManager.getClaimValue(claims[0]);
        expect(claimValue).toBeDefined();


    });
});
