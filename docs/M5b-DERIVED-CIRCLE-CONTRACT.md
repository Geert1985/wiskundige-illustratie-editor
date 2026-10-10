# M5b derived circle: center and perimeter point

2026-10-10. Recipe circleByCenterPoint -> circle, ordered point/point sources (center then perimeter point). Existing point, endpoint or polygon vertex references allowed. Computed fields cx,cy,r; r = hypot(P.x-C.x,P.y-C.y). Radius <=1e-9 invalid COINCIDENT_POINTS. Finite/coordinate limit 1e12 checks include center and radius. Requires constructionSchema 2; no new object type or model version.

Initial invalid creation fails atomically. Parent motion changes center/radius without changing ID/style or relationships. Invalidity retains last geometry and hides result; dependent path points, tangents and intersections see SOURCE_INVALID and recover. Direct circle coordinate/radius edits blocked; source rebinding, locks, detachment, delete cascade, groups/layers, replay and source grants reuse existing infrastructure.

UI Cirkel via punten in Constructies, first center then perimeter source. Two-step instructions and hover use existing owner. New circle has red stroke and normal unfilled default; styles may be overridden. Does not belong to point-producing split-button. Circle through three points and triangle circumcircle remain separate from this center/perimeter construction; M6 triangle centers unchanged. Next M5b task: linked-point tangent audit.
