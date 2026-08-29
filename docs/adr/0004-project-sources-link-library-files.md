---
status: accepted
---

# Project Sources link Library Files without moving them

Project Source membership must not reorganize the owner's Library. A Source is a link between a Project and an owned Library File. Adding or removing that link leaves the File at its current Library root or Folder location. The Project Folder remains the default destination for Files uploaded on the Project page or inside Project Chats, and those new Files are linked as Sources.

This supersedes the folder-as-membership part of ADR 0003. Its model-context decision remains: Sources organize Files and are never sent to the model.

## Consequences

- Moving a File within the Library does not add or remove its Project Source links.
- Removing a Source never moves or deletes the File.
- Deleting a File removes its Source links. Deleting a Project removes its Source links but preserves Files.
- A Project Folder is an upload destination, not the complete list of Project Sources.
