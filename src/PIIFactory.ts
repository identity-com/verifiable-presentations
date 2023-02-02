import * as R from 'ramda';
import { v4 as uuidv4 } from 'uuid';
import { VerifiablePresentationManager, ClaimCriteriaMap, CredentialArtifacts } from './VerifiablePresentationManager';
import DsrResolver from '@identity.com/dsr';
import { Credential } from './Credential';

const { ScopeRequest } = DsrResolver;
/**
 * Get the names of the evidence documents promised by a DSR response
 *
 * EvidenceProofs in a DSR response look like this:
 * "evidenceProofs": [{
 *       "name": "credential-cvc:IdDocument-v2",
 *       "proofs": {
 *         "idDocumentFront": {
 *           "data": "195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4"
 *         }
 *       }
 *    }]
 * For each entry in the list of evidence proofs, extract the actual document names
 * @return {Array<String>}
 */
const evidenceProofsToDSRDocumentNames = (evidenceProofs: any = []) => R.pipe(
  R.pluck('proofs'),
  R.map(Object.keys),
  R.flatten,
)(evidenceProofs);

/** returns the evidences document names from the provider DSR */
const dsrRequestedDocuments = (dsrRequest: object) => Object.keys(R.pathOr([], ['payload', 'channels', 'evidences'], dsrRequest));
/**
 * Traverse the provided presentation credentials and creates a map of document proofs for each
 * credential identifier
 * @param {Array<Credential>} presentations: an array of credentials
 * @param {Array<String>} requestedDocuments: documents that the DSR asks for
 * @returns {Array}: e.g. {
 * *      name: 'credential-cvc:IdDocument-v2',
 * *      proofs: {
 * *         idDocumentFront: { data: '195f9bf62b1a807abe26828c13f29e443169cdc5f60b22b470bfa50eef55a5a4' },
 * *       }
 * *     }
 */
const evidenceProofsFromCredentials = (presentations: Credential[], requestedDocuments: any = []) => presentations
  .map(
    (credential: Credential) => {
      const evidenceClaims = R.pathOr([], ['claim', 'document', 'evidences'], credential);
      const filteredEvidenceClaims = R.pick(requestedDocuments, evidenceClaims);
      return { name: credential.identifier, proofs: R.mergeAll(filteredEvidenceClaims) };
    }
  )
  // only return evidence proofs for credentials that require evidence
  .filter(evidenceProofsByCredential => R.not(R.isEmpty(evidenceProofsByCredential.proofs)));

/**
 * Return the list of evidence documents that the DSR response promises
 * @param {Object} dsrResponse
 * @param {Object} dsrRequest
 */
const expectedEvidenceProofs = (dsrResponse: DSRResponse, dsrRequest: object) => {
  const presentations: Credential[] = dsrResponse.verifiableData.map(R.prop('credential'));
  return evidenceProofsFromCredentials(presentations, dsrRequestedDocuments(dsrRequest));
};



/**
 * Add an upload url to an evidence channel, so the client knows where to send the evidence documents.
 * The url will be generated by the client to be unique
 * @param {Function} urlGeneratorFn: A function to generate a unique URL based on the evidence name provided
 * @return {function(*, *): {url: *}}
 */
const addEvidenceUrl = (urlGeneratorFn: (evidenceName: string) => string) => (evidenceChannelConfiguration: object, evidenceName: string) => {
  const url = urlGeneratorFn(evidenceName);
  return {
    ...evidenceChannelConfiguration,
    url,
  };
};

export interface CredentialItemRequest {
  requestIndex?: number,
  identifier?: string,
  constraints?: any,
}
export interface VerifiableDataItem {
  credentialItemRequest?: CredentialItemRequest,
  credential?: Credential,
  requestStatus?: any[] | null,
  userId?: string | null
}
export interface DSRResponse {
  verifiableData?: VerifiableDataItem[],
  requestStatus?: any[] | null,
  userId?: string | null
}
export interface Formatters {
  [key: string]: any;
}
/**
 * A class for extracting PII from a DSR Response based on a specific dsrRequest implementation, with a given mapping and formatters,
 * specific to that DSR
 */
export class PIIFactory {
  dsrRequest: object;
  mapping: ClaimCriteriaMap;
  formatters: Formatters;
  /**
   * @param {Object} dsrRequest
   * @param {ClaimCriteriaMap} mapping
   * @param {Formatters} formatters
   */
  constructor(dsrRequest: object, mapping: ClaimCriteriaMap, formatters: object) {
    this.dsrRequest = dsrRequest;
    this.mapping = mapping;
    this.formatters = formatters;
  };

  /**
   * The client is asked for a list of documents that the provider is interested in (requestedDocuments)
   * It returns in the credential, a list of documents that it can provide.
   * Return the intersection between these two, to identify which documents are expected.
   *
   * @param evidenceProofs
   * @return {string[]}
   */
  expectedDocumentsGivenEvidenceProofs(evidenceProofs?: any[]) {
    const promisedDocuments = evidenceProofsToDSRDocumentNames(evidenceProofs);
    return R.intersection(dsrRequestedDocuments(this.dsrRequest), promisedDocuments);
  };

  /**
   * Validate the dsr response, extract the PII, and format it for the provider.
   * @param dsrResponse
   * @return {Promise<{evidenceProofs: *, formattedClaims: *}>}
   */
  async extractPII(dsrResponse: DSRResponse) {
    const presentations: Credential[] = dsrResponse.verifiableData.map(R.prop('credential'));
    const evidenceProofs = expectedEvidenceProofs(dsrResponse, this.dsrRequest);
    const artifacts: CredentialArtifacts = {
      presentations,
      evidences: [],
    };
    try {
      const verifiablePresentation = new VerifiablePresentationManager({
        skipAddVerify: true, skipGetVerify: true, allowGetUnverified: true,
      });
      // this throws an error if the DSR response is invalid
      await verifiablePresentation.addCredentialArtifacts(artifacts);

      // using the credential to provider mapping, get the credentials values
      const mappedClaimValues = await verifiablePresentation.mapClaimValues(this.mapping);

      const formatIfFormatterExists = (value: any, key: string) => (value && this.formatters[key] ? this.formatters[key].format(value) : value);
      const formattedClaims = R.mapObjIndexed(formatIfFormatterExists, mappedClaimValues);

      return { formattedClaims, evidenceProofs };
    } catch (error) {
      throw new Error('The dsr response on the requirements is invalid');
    }
  };
  /**
   * Generate a DSR based on the template and evidence functions provided
   * @param {String} eventsURL
   * @param {String} idvDid
   * @param {Object} dsrResolver
   * @param {Function} urlGeneratorFn
   */
  async generateDSR(eventsURL: string, idvDid: string, dsrResolver: object, urlGeneratorFn: (evidenceName: string) => string) {

    if (!this.dsrRequest) { throw new Error('DSR not provided'); }

    const uuid = uuidv4();
    const requestedItems = R.pathOr([], ['payload', 'credentialItems'], this.dsrRequest);
    // iterate over the requested items array, set the values on the path constraints.meta.issue.is.$eq for the idv value
    const updatedRequestedItems = R.map(R.assocPath((['constraints', 'meta', 'issuer', 'is', '$eq']), idvDid))(requestedItems);

    // add a fresh S3 upload url to each evidence channel, tailored for this user
    const evidenceChannelTemplate = R.pathOr([], ['payload', 'channels', 'evidences'], this.dsrRequest);
    const evidences = R.mapObjIndexed(addEvidenceUrl(urlGeneratorFn), evidenceChannelTemplate);

    const channelsConfig = {
      eventsURL,
      evidences,
    };
    const appConfig = R.pathOr([], ['payload', 'requesterInfo', 'app'], this.dsrRequest);

    const scopeRequest = await ScopeRequest.ScopeRequest.create(uuid, updatedRequestedItems, channelsConfig, appConfig, dsrResolver);
    return ScopeRequest.buildSignedRequestBody(scopeRequest);
  };
}
