"""GridGuard Domain Mapping: Canonical Mumbai Metropolitan Grid <-> Western Utility Grid Aliases.

This module provides formal domain mapping and bidirectional resolution between
canonical Mumbai network entities (e.g. TX-MUM-1042, FDR-MUM-22) and operational
Western utility aliases (e.g. TX-04 / TX-Oak-04, Feeder F-03, WEST-SUB).
"""

from typing import Dict, List, Optional

# Mapping Western Utility Asset IDs & Aliases to Canonical Mumbai Asset IDs
WESTERN_TO_MUMBAI_ASSET_MAP: Dict[str, str] = {
    # TX-04 / TX-Oak-04: High-risk critical transformer (1840 customers, 45d overdue)
    "TX-04": "TX-MUM-1042",
    "TX-Oak-04": "TX-MUM-1042",
    # TX-09: Stale RTU telemetry asset
    "TX-09": "TX-MUM-1028",
    # TX-Pine-02: Degraded sensor / designated tie feeder transfer target
    "TX-Pine-02": "TX-MUM-1015",
    # TX-01: Nominal baseline transformer
    "TX-01": "TX-MUM-1001",
    # TX-Maple-01: Healthy baseline with cooling redundancy
    "TX-Maple-01": "TX-MUM-1035",
    # Secondary auxiliary nodes
    "TX-Elm-01": "TX-MUM-1045",
    "TX-Cedar-03": "TX-MUM-1018",
}

# Mapping Canonical Mumbai Asset IDs to Primary Western Operational Alias
MUMBAI_TO_WESTERN_ASSET_MAP: Dict[str, str] = {
    "TX-MUM-1042": "TX-Oak-04",
    "TX-MUM-1028": "TX-09",
    "TX-MUM-1015": "TX-Pine-02",
    "TX-MUM-1001": "TX-01",
    "TX-MUM-1035": "TX-Maple-01",
    "TX-MUM-1045": "TX-Elm-01",
    "TX-MUM-1018": "TX-Cedar-03",
}

# Mapping Western Utility Feeders & Substations to Canonical Mumbai Feeders
WESTERN_TO_MUMBAI_FEEDER_MAP: Dict[str, str] = {
    # Andheri East / Feeder F-03 / Feeder-14B (Parent of TX-MUM-1042 / TX-04)
    "Feeder F-03": "FDR-MUM-22",
    "FEEDER F-03": "FDR-MUM-22",
    "FDR-F-03": "FDR-MUM-22",
    "Feeder-14B": "FDR-MUM-22",
    "F-14B": "FDR-MUM-22",
    "SUB-ANDHERI": "FDR-MUM-22",
    # Kurla Central / Feeder F-04 (Parent of TX-MUM-1028 / TX-09)
    "Feeder F-04": "FDR-MUM-33",
    "FEEDER F-04": "FDR-MUM-33",
    "FDR-F-04": "FDR-MUM-33",
    "EAST-SUB": "FDR-MUM-33",
    "East Substation": "FDR-MUM-33",
    "SUB-KURLA": "FDR-MUM-33",
    # Bandra West / Feeder F-01 / Feeder-14A / WEST-SUB (Parent of TX-MUM-1001 / TX-MUM-1015)
    "Feeder F-01": "FDR-MUM-11",
    "FEEDER F-01": "FDR-MUM-11",
    "FDR-F-01": "FDR-MUM-11",
    "Feeder-14A": "FDR-MUM-11",
    "F-14A": "FDR-MUM-11",
    "WEST-SUB": "FDR-MUM-11",
    "West Substation": "FDR-MUM-11",
    "SUB-BANDRA": "FDR-MUM-11",
    # Colaba Port / NORTH-SUB (Feeder for TX-MUM-1035 / TX-Maple-01)
    "NORTH-SUB": "FDR-MUM-44",
    "North Substation": "FDR-MUM-44",
    "SUB-COLABA": "FDR-MUM-44",
    # Thane Industrial / SOUTH-SUB (Feeder for TX-MUM-1045 / TX-Elm-01)
    "SOUTH-SUB": "FDR-MUM-55",
    "South Substation": "FDR-MUM-55",
    "SUB-THANE": "FDR-MUM-55",
}

# Mapping Canonical Mumbai Feeders to Primary Western Operational Alias
MUMBAI_TO_WESTERN_FEEDER_MAP: Dict[str, str] = {
    "FDR-MUM-22": "Feeder F-03",
    "FDR-MUM-33": "Feeder F-04",
    "FDR-MUM-11": "Feeder F-01",
    "FDR-MUM-44": "NORTH-SUB",
    "FDR-MUM-55": "SOUTH-SUB",
}


def resolve_canonical_asset_id(asset_id: str) -> str:
    """Resolves any operational alias (e.g. TX-04, TX-Oak-04) to its canonical Mumbai asset ID.

    If the asset_id is already canonical or not in the alias map, returns asset_id unchanged.
    """
    if not asset_id:
        return asset_id
    cleaned = asset_id.strip()
    return WESTERN_TO_MUMBAI_ASSET_MAP.get(cleaned, cleaned)


def resolve_canonical_feeder_id(feeder_id: str) -> str:
    """Resolves any operational feeder/substation alias (e.g. Feeder F-03, WEST-SUB)

    to its canonical Mumbai feeder ID (e.g. FDR-MUM-22).
    """
    if not feeder_id:
        return feeder_id
    cleaned = feeder_id.strip()
    return WESTERN_TO_MUMBAI_FEEDER_MAP.get(cleaned, cleaned)


def get_primary_asset_alias(canonical_id: str) -> Optional[str]:
    """Returns the primary operational alias for a canonical Mumbai asset ID."""
    return MUMBAI_TO_WESTERN_ASSET_MAP.get(canonical_id)


def get_primary_feeder_alias(canonical_id: str) -> Optional[str]:
    """Returns the primary operational alias for a canonical Mumbai feeder ID."""
    return MUMBAI_TO_WESTERN_FEEDER_MAP.get(canonical_id)


def get_all_asset_aliases(canonical_id: str) -> List[str]:
    """Returns all aliases that resolve to the given canonical asset ID."""
    return [alias for alias, can_id in WESTERN_TO_MUMBAI_ASSET_MAP.items() if can_id == canonical_id]


def get_all_feeder_aliases(canonical_id: str) -> List[str]:
    """Returns all aliases that resolve to the given canonical feeder ID."""
    return [alias for alias, can_id in WESTERN_TO_MUMBAI_FEEDER_MAP.items() if can_id == canonical_id]
