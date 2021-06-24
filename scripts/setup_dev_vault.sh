export VAULT_ADDR='http://127.0.0.1:8200'
vault server -dev -dev-root-token-id=zoints
echo "zoints" | vault login -
vault kv put secret/zee funder=LrT2eeZ/uIfaKE4ndMwOWHLNItd8sv41TY29JfzkTIumkml/Ht55gLc8ycbrEqokZYgWBiNP3GPAVZNXtQrp1Q== mint=yMSUZSuvb1R0Bqpjej/78ZDL1QzYY9pDrYkZScZ13EH1ccqDTFmxW63l+JAAMJeNmIR0mrn8jCaNX7KBIzvMKw== mintAuthority=dR8MVdfSh6caEPunOD/eNgfhNZMD2IxlEJ86dpM3Vj+3wT6sExGCWLFXXHscKkdXCrXFiRn6Y27BFSABqkO8rA==
