// Native characters intentionally have no rework skill record in the final manifest.
export function skillDescription(character){return character.skill?.description||character.skill?.desc||character.ability.skillSummary;}
