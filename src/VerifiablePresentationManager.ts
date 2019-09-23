import crypto from 'crypto';
import _ from 'lodash';
import {
    ClaimIdentifier,
    CredentialIdentifier,
    CredentialProofLeave,
    Credential
} from './Credential';
import { PresentationVerifier, VerifyFunction } from './PresentationVerifier';

/**
 * Used to setup VerifiablePresentationManager global behavior
 */
export interface VPMOptions {
    /**
     * disable the verification when adding new items to manager control. default, false.
     */
    skipAddVerify?: boolean;
    /**
     * disable the verification when getting managed values. default, false.
     */
    skipGetVerify?: boolean;
    /**
     * Allow to get values if both verifications are disabled. default, false.
     */
    allowGetUnverified?: boolean;
    /**
     *  Avoid to throw exceptions. Useful for batch operation but is not a good practice. default, false.
     */
    notThrow?: boolean
}

/**
 * An unique reference to a managed presentation
 */
export interface PresentationReference {
    /**
     * see [[CredentialIdentifier]]
     */
    identifier: CredentialIdentifier;
    /**
     * an unique key
     */
    uid: string;
}

/**
 * An unique reference to a managed claim
 */
export interface AvailableClaim {
    /**
     * see [[ClaimIdentifier]]
     */
    identifier: ClaimIdentifier;
    /**
     * see [[PresentationReference]]
     */
    credentialRef: PresentationReference;
    /**
     * the structure path here to find the claim values
     */
    claimPath: string;
}

/**
 * A search criteria to find managed claim
 */
export interface SearchClaimCriteria {
    identifier?: ClaimIdentifier;
    credentialRef?: PresentationReference;
    claimPath?: string;
}

/**
 * A mapping from key (an identifier) to a search claim criteria
 */
export interface ClaimCriteriaMap {
    [key: string] : SearchClaimCriteria;
}

/**
 * A mapping from key (an identifier) to claim value (an object)
 */
export interface ClaimValueMap {
    [key: string] : any;
}

/**
 * An Manager to secure handle Verifiable Presentations and Evidences.
 *
 * A Verifiable Presentation is a filtered credential that doesn't have all the expected claims for
 * an Verifiable Credential of the type but still holds all verification properties for the claims
 * presented in the shared JSON structure.
 *
 * An Evidence is data collect during the validation process that is present as a Verifiable Claim
 * but can be linked to a claim. Making it possible to verify if that data was the same used to issue
 * the credential. This is useful for document images, selfies, etc...
 */

/**
 * Evidence representation
 */
export interface Evidence {
    /**
     * The Evidence content ("selfie", "idDocumentBack", "idDocumentFront")
     */
    content: string;
    /**
     * The Evidence content-type
     */
    contentType: string;
    /**
     * The Evidence sha256
     */
    sha256: string;
    /**
     * The base 64 encoded representation of the evidence
     */
    base64Encoded: string;
}

/**
 * Optional sets of Verifiable Presentations and/or Evidences in a JSONformat
 */
export interface CredentialArtifacts {
    /**
     * an array of JSONs with Verifiable (Credentials or Presentation)
     */
    presentations?: Credential[];

    /**
     * an array of JSONs with Evidences (Credentials or Presentation)
     */
    evidences?: Evidence[];
}


/**
 * Summary of the VerifiablePresentationManager status exposing the current configuration
 * and an aggregation of it managed state
 */
export interface VerifiablePresentationManagerStatus {
    config: VPMOptions;
    verifiedPresentations: number;
    totalPresentations: number;
    verifiedEvidences: number;
    totalEvidences: number;
}

/**
 * JSON contain a DSR
 */
export type DSRJSON = string;


/**
 * Abstract all complexity about the Verifiable Credentials handling by providing utility methods
 * to access user verified data in a secure way unless the security behavior is explicit flexed.
 *
 * By Default the only check not performed is the blockchain anchor check that must be explicit enable
 * by providing a verification plugin that can handle the verification in a async way.
 */
export class VerifiablePresentationManager {
    options: VPMOptions;
    artifacts: CredentialArtifacts;
    presentations: PresentationReference[];
    claims: AvailableClaim[];
    status: VerifiablePresentationManagerStatus;
    verifier : PresentationVerifier;

    /**
     * @param options - Defines the global behavior and security of VerifiablePresentationManager
     * @param verifyAnchor - An async function that is able to verify the presentation anchor in a public Blockchain
     */
    constructor(options: VPMOptions, verifyAnchor? : VerifyFunction) {
        this.options = {
            skipAddVerify: false,
            skipGetVerify: false,
            allowGetUnverified: false,
            notThrow: false,
            ...options
        };
        this.artifacts = {
            presentations: [],
            evidences: []
        }
        this.presentations = [];
        this.claims = [];
        this.status = {
            config: options,
            verifiedPresentations: 0,
            totalPresentations: 0,
            verifiedEvidences: 0,
            totalEvidences: 0
        }
        this.verifier = new PresentationVerifier(verifyAnchor);
    }

    /**
     * Adds a set of Verifiable Presentations and Evidences to the manager control
     *
     * if neither `skipAddVerify` or `notThrow` are true, it throws an acception
     * once it process one invalid artifact.
     *
     * @param artifacts
     *
     */
    // @ts-ignore
    async addCredentialArtifacts(artifacts: CredentialArtifacts): Promise<VerifiablePresentationManagerStatus> {
        this.aggregateCredentialArtifacts(artifacts);

        if (artifacts.presentations) {
            artifacts.presentations.forEach(presentation => {
                const presentationReference = this.getPresentationReference(presentation);
                this.presentations.push(presentationReference);

                const availableClaims = this.getAvailableClaims(presentation.proof.leaves, presentationReference);
                this.claims = this.claims.concat(availableClaims);
            });
        }

        if (!this.options.skipAddVerify) {
            return this.verifyAllArtifacts();
        }

        this.status.totalPresentations = this.artifacts.presentations.length;
        this.status.totalEvidences = this.artifacts.evidences.length;
        return this.status;
    }

    /**
     * List managed presentations returning in accordance with the config
     *
     * if `allowGetUnverified` is true, presentations that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listPresentations(): Promise<PresentationReference[]> {
        let verifiedPresentationRefs : PresentationReference[] = [];
        if (!this.options.skipGetVerify) {
            verifiedPresentationRefs = await this.getVerifiedPresentationRefs();
        }
        return (this.options.allowGetUnverified) ? this.presentations : verifiedPresentationRefs;
    };

    /**
     * List managed claim returning in accordance with the config
     *
     * if `allowGetUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listClaims(): Promise<AvailableClaim[]> {
        let claimsFromVerifiedPresentations : AvailableClaim[] = [];
        if (!this.options.skipGetVerify) {
            const verifiedPresentationRefs = await this.getVerifiedPresentationRefs();
             claimsFromVerifiedPresentations = _.filter(
                this.claims,
                (claim : AvailableClaim) => verifiedPresentationRefs.includes(claim.credentialRef)
            );
        }
        return (this.options.allowGetUnverified) ? this.claims : claimsFromVerifiedPresentations;
    };

    /**
     * List managed claim of a given Credential type returning in accordance with the config
     *
     * if `allowGetUnverified` is true, claim that were not verified yet will be returned.
     * but known invalid presentations are never returned
     *
     */
    async listPresentationClaims(presentationRef: PresentationReference): Promise<AvailableClaim[]> {
        let verified = false;
        if (!this.options.skipGetVerify) {
            verified = await this.verifyPresentation(presentationRef);
        }
        const claims = _.filter(this.claims, { credentialRef: presentationRef });
        return (this.options.allowGetUnverified || verified) ? claims : [];
    };

    /**
     * Search for a valid claim tha matches the criterias.
     * if `allowGetUnverified` is true the search also include claim not verified yet.
     * the search never includes known invalid claims
     */
    async findClaims(criteria: SearchClaimCriteria): Promise<AvailableClaim[] | null> {
        const claims = _.filter(this.claims, criteria);

        const verifiedPresentations : PresentationReference[] = [];
        if (!this.options.skipGetVerify) {
            const presentationRefs = claims.map((claim : AvailableClaim) => claim.credentialRef);
            for (const presentationRef of presentationRefs) {
                const verified = await this.verifyPresentation(presentationRef);
                if (verified) {
                    verifiedPresentations.push(presentationRef);
                }
            }
        }

        return (this.options.allowGetUnverified)
            ? claims
            : _.filter(claims, (claim : AvailableClaim) => verifiedPresentations.includes(claim.credentialRef));
    }

    /**
     * Get a mapping from key to a claim search criteria and resolve the claim search criterias,
     * returning a mapping from the same keys to the relative claim value.
     * if `allowGetUnverified` is true the search also include claim not verified yet.
     * if no claim matches a claim criteria, the value for the relative key will be null.
     */
    async mapClaimValues(claimCriteriaMap: ClaimCriteriaMap, flatten? : boolean): Promise<ClaimValueMap> {
        const claimMappedValues : ClaimValueMap = {};
        for (const key of _.keys(claimCriteriaMap)) {
            const criteria = claimCriteriaMap[key];
            const claims = await this.findClaims(criteria);
            claimMappedValues[key] = claims.length ? await this.getClaimValue(claims[0]) : null;
        }

        if (flatten) {
            return _.keys(claimMappedValues).map(key => (
                { name: key, value: claimMappedValues[key] }
            ));
        }

        return claimMappedValues;
    }

    /**
     * return the STRING value of a valid avaliable claim.
     * if `allowGetUnverified` is true it returns unverified values.
     * if `notThrow` is true return null for known invalid claims
     */
    async getClaimValue(availableClaim: AvailableClaim): Promise<any | null> {
        const presentation = this.getPresentation(availableClaim);
        if (!presentation || !presentation.claim) {
            return null;
        }

        let verified = false;
        if (!this.options.skipGetVerify) {
           verified = await this.verifyPresentation(availableClaim.credentialRef);
        };
        if (!verified && !this.options.allowGetUnverified) {
            return null; 
        }

        return _.get(presentation.claim, availableClaim.claimPath);
    }

    /**
     * List managed evidences
     * if `allowGetUnverified` is true it return unverified values.
     */
    async listEvidences() : Promise<Evidence[]> {
        let verifiedEvidences : Evidence[] = [];
        if (!this.options.skipGetVerify) {
            const verifiedPresentations = await this.verifyPresentations(true);
            verifiedEvidences = this.verifyEvidences(verifiedPresentations);
        }
        return (this.options.allowGetUnverified) ? this.artifacts.evidences : verifiedEvidences;
    }

    /**
     * Verify all artifacts and return a status of all presentations and evidences
     *
     * if neither `skipAddVerify` or `notThrow` are true, it throws an acception
     * once it process one invalid artifact.
     */
    async verifyAllArtifacts(): Promise<VerifiablePresentationManagerStatus> {
        const verifiedPresentations = await this.verifyPresentations();
        const verifiedEvidences = this.verifyEvidences(verifiedPresentations);
        this.status = {
            config: this.options,
            verifiedPresentations: verifiedPresentations.length,
            totalPresentations: this.artifacts.presentations.length,
            verifiedEvidences: verifiedEvidences.length,
            totalEvidences: this.artifacts.evidences.length,
        }
        return this.status;
    }

    /**
     * Verify if an presentation was GRANTED for a specif DSR
     *
     * This will first verify that the DSR is valid and not tampered,
     * them will verify if the presentation was shared with user consent and signatures
     *
     * @param presentationRef the managed presentation to verify
     * @param originalRequestDSR the original Dynamic Scope Request that receive the presentation as result
     */
    // @ts-ignore
    async wasGrantedForDSR(presentationRef: PresentationReference, originalRequestDSR: DSRJSON) {
        // @ts-ignore
        // TODO
        throw new Error(`Not implemented`);
    }

    /**
     * Return true if all artifacts are verified, otherwise return false
     *
     * if neither `skipGetVerify` or `notThrow` are true, it throws an acception
     */
    async isAllArtifactsVerified() {
        const status = this.options.skipGetVerify ? this.status : await this.verifyAllArtifacts();
        return (status.totalPresentations === status.verifiedPresentations)
            && (status.totalEvidences === status.verifiedEvidences);
    }

    /**
     * Remove the invalid artifacts and return a status of the resultant artifacts 
     */
    async purgeInvalidArtifacts() : Promise<VerifiablePresentationManagerStatus> {
        const verifiedPresentations = await this.verifyPresentations(true);
        const verifiedIds = _.map(verifiedPresentations, (presentation : Credential) => presentation.id);
        const verifiedEvidences = this.verifyEvidences(verifiedPresentations, true);
        this.artifacts = {
            presentations: verifiedPresentations,
            evidences: verifiedEvidences 
        }
        _.remove(
            this.presentations,
            (presentationRef : PresentationReference) => !verifiedIds.includes(presentationRef.uid)
        );
        _.remove(
            this.claims,
            (claim : AvailableClaim) => !verifiedIds.includes(claim.credentialRef.uid)
        );
        this.status.totalPresentations = this.artifacts.presentations.length;
        this.status.totalEvidences = this.artifacts.evidences.length;
        return this.status;
    }

    /*
     * Private mthods
     */

    private getPresentation(availableClaim : AvailableClaim) : Credential | undefined {
        return _.find(this.artifacts.presentations, (presentation : Credential) => (
            presentation.id === availableClaim.credentialRef.uid
        ));
    }

    private findEvidencePresentation(evidence : Evidence) : Credential | undefined {
        return _.find(this.artifacts.presentations, (presentation : Credential) => {
            const presentationClaims = JSON.stringify(presentation.claim);
            return presentationClaims.includes(evidence.sha256);
        });
    }

    private aggregateCredentialArtifacts(artifacts : CredentialArtifacts) {
        if (this.artifacts.presentations && artifacts.presentations) {
            this.artifacts.presentations = this.artifacts.presentations.concat(artifacts.presentations);
        }
        if (this.artifacts.evidences && artifacts.evidences) {
            this.artifacts.evidences = this.artifacts.evidences.concat(artifacts.evidences);
        }
    }

    private getPresentationReference(credential: Credential) : PresentationReference {
        return {
            identifier: credential.identifier,
            uid: credential.id
        };
    }

    private getAvailableClaims(claims: CredentialProofLeave[], presentation: PresentationReference) {
        return claims.map((claim: CredentialProofLeave) => ({
            identifier: claim.identifier,
            credentialRef: presentation,
            claimPath: claim.claimPath
        }));
    }

    private async verifyPresentation(presentationRef : PresentationReference) : Promise<boolean> {
        const credential = _.find(this.artifacts.presentations, (presentation : Credential) => (
            presentation.id === presentationRef.uid
        ));
        const verified = await this.verifier.cryptographicallySecureVerify(credential);

        if (!this.options.notThrow && !verified) {
            throw new Error(`Unverified Presentation: ${credential.id}`);
        }

        return verified;
    }

    private async verifyPresentations(notThrow = this.options.notThrow) : Promise<Credential[]> {
        const verifiedPresentations : Credential[] = [];
        for (const presentation of this.artifacts.presentations) {
            const verified = await this.verifier.cryptographicallySecureVerify(presentation);
            if (verified) {
                verifiedPresentations.push(presentation);
            }
        }
        if (!notThrow) {
            const unverifiedPresentations = _.difference(this.artifacts.presentations, verifiedPresentations);
            if (!_.isEmpty(unverifiedPresentations)) {
                const unverifiedIds = _.map(unverifiedPresentations, (presentation : Credential) => presentation.id);
                throw new Error(`Unverified Presentations: ${_.join(unverifiedIds)}`);
            }
        }
        return verifiedPresentations;
    }

    private verifyEvidence(evidence : Evidence, verifiedPresentations : Credential[]) : boolean {
        // check if there is a valid presentation referencing the evidence
        const presentation = this.findEvidencePresentation(evidence);
        if (!presentation || !_.find(verifiedPresentations, { id: presentation.id })) {
            return false;
        }

        // check if the base64 data hash matches the sha256 value
        const dataPrefix = /^data:.*;base64,/;
        const base64Data = _.replace(evidence.base64Encoded, dataPrefix, ''); // remove prefix
        const decodedData = Buffer.from(base64Data, 'base64');
        const calculatedSha256 = crypto.createHash('sha256').update(decodedData).digest('hex');
        return (calculatedSha256 === evidence.sha256);
    }

    private verifyEvidences(verifiedPresentations : Credential[], notThrow = this.options.notThrow) : Evidence[] {
        const verifiedEvidences = _.filter(this.artifacts.evidences, (evidence : Evidence) => (
            this.verifyEvidence(evidence, verifiedPresentations)
        ));
        if (!notThrow) {
            const unverifiedEvidences = _.difference(this.artifacts.evidences, verifiedEvidences);
            if (!_.isEmpty(unverifiedEvidences)) {
                const unverifiedIds = _.map(unverifiedEvidences, (evidence : Evidence) => evidence.content);
                throw new Error(`Unverified Evidences: ${_.join(unverifiedIds)}`);
            }
        }
        return verifiedEvidences;
    }

    private async getVerifiedPresentationRefs(): Promise<PresentationReference[]> {
        const verifiedPresentations = await this.verifyPresentations();
        const verifiedIds = _.map(verifiedPresentations, (presentation : Credential) => presentation.id);
        return _.filter(
            this.presentations,
            (presentation : PresentationReference) => verifiedIds.includes(presentation.uid)
        );
    }
}
