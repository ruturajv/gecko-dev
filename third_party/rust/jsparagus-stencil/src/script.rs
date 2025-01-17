//! The result of emitter

use crate::frame_slot::FrameSlot;
use crate::function::FunctionFlags;
use crate::gcthings::GCThing;
use crate::scope::ScopeIndex;
use crate::scope_notes::ScopeNote;
use ast::source_atom_set::SourceAtomSetIndex;

// WARNING
// The following section is generated by update_stencil.py.
// Do mot modify manually.
//
// @@@@ BEGIN TYPES @@@@
#[derive(Debug, Clone, Copy)]
pub enum ImmutableScriptFlagsEnum {
    #[allow(dead_code)]
    IsForEval = 1 << 0,
    #[allow(dead_code)]
    IsModule = 1 << 1,
    #[allow(dead_code)]
    IsFunction = 1 << 2,
    #[allow(dead_code)]
    SelfHosted = 1 << 3,
    #[allow(dead_code)]
    ForceStrict = 1 << 4,
    #[allow(dead_code)]
    HasNonSyntacticScope = 1 << 5,
    #[allow(dead_code)]
    NoScriptRval = 1 << 6,
    #[allow(dead_code)]
    TreatAsRunOnce = 1 << 7,
    #[allow(dead_code)]
    Strict = 1 << 8,
    #[allow(dead_code)]
    HasModuleGoal = 1 << 9,
    #[allow(dead_code)]
    HasInnerFunctions = 1 << 10,
    #[allow(dead_code)]
    HasDirectEval = 1 << 11,
    #[allow(dead_code)]
    BindingsAccessedDynamically = 1 << 12,
    #[allow(dead_code)]
    HasCallSiteObj = 1 << 13,
    #[allow(dead_code)]
    IsAsync = 1 << 14,
    #[allow(dead_code)]
    IsGenerator = 1 << 15,
    #[allow(dead_code)]
    FunHasExtensibleScope = 1 << 16,
    #[allow(dead_code)]
    FunctionHasThisBinding = 1 << 17,
    #[allow(dead_code)]
    NeedsHomeObject = 1 << 18,
    #[allow(dead_code)]
    IsDerivedClassConstructor = 1 << 19,
    #[allow(dead_code)]
    IsFieldInitializer = 1 << 20,
    #[allow(dead_code)]
    HasRest = 1 << 21,
    #[allow(dead_code)]
    NeedsFunctionEnvironmentObjects = 1 << 22,
    #[allow(dead_code)]
    FunctionHasExtraBodyVarScope = 1 << 23,
    #[allow(dead_code)]
    ShouldDeclareArguments = 1 << 24,
    #[allow(dead_code)]
    ArgumentsHasVarBinding = 1 << 25,
    #[allow(dead_code)]
    AlwaysNeedsArgsObj = 1 << 26,
    #[allow(dead_code)]
    HasMappedArgsObj = 1 << 27,
    #[allow(dead_code)]
    IsLikelyConstructorWrapper = 1 << 28,
}

#[derive(Debug, Clone, Copy)]
pub enum MutableScriptFlagsEnum {
    #[allow(dead_code)]
    HasRunOnce = 1 << 8,
    #[allow(dead_code)]
    HasBeenCloned = 1 << 9,
    #[allow(dead_code)]
    HasScriptCounts = 1 << 10,
    #[allow(dead_code)]
    HasDebugScript = 1 << 11,
    #[allow(dead_code)]
    NeedsArgsAnalysis = 1 << 12,
    #[allow(dead_code)]
    NeedsArgsObj = 1 << 13,
    #[allow(dead_code)]
    AllowRelazify = 1 << 14,
    #[allow(dead_code)]
    SpewEnabled = 1 << 15,
    #[allow(dead_code)]
    BaselineDisabled = 1 << 16,
    #[allow(dead_code)]
    IonDisabled = 1 << 17,
    #[allow(dead_code)]
    FailedBoundsCheck = 1 << 18,
    #[allow(dead_code)]
    FailedShapeGuard = 1 << 19,
    #[allow(dead_code)]
    HadFrequentBailouts = 1 << 20,
    #[allow(dead_code)]
    HadOverflowBailout = 1 << 21,
    #[allow(dead_code)]
    Uninlineable = 1 << 22,
    #[allow(dead_code)]
    InvalidatedIdempotentCache = 1 << 23,
    #[allow(dead_code)]
    FailedLexicalCheck = 1 << 24,
}

// @@@@ END TYPES @@@@

#[derive(Debug)]
pub struct ImmutableScriptFlags {
    value: u32,
}

impl ImmutableScriptFlags {
    pub fn new() -> Self {
        Self { value: 0 }
    }

    pub fn from_raw(bits: u32) -> Self {
        Self { value: bits }
    }

    pub fn set(&mut self, bit: ImmutableScriptFlagsEnum) {
        self.value |= bit as u32;
    }

    pub fn has(&self, bit: ImmutableScriptFlagsEnum) -> bool {
        (self.value & bit as u32) != 0
    }

    pub fn reset(&mut self, bit: ImmutableScriptFlagsEnum) {
        self.value &= !(bit as u32)
    }
}

impl From<ImmutableScriptFlags> for u32 {
    fn from(flags: ImmutableScriptFlags) -> u32 {
        flags.value
    }
}

/// Maps to js::ImmutableScriptData in m-c/js/src/vm/SharedStencil.h.
#[derive(Debug)]
pub struct ImmutableScriptData {
    pub main_offset: u32,
    pub nfixed: FrameSlot,
    pub nslots: u32,
    pub body_scope_index: u32,
    pub num_ic_entries: u32,
    pub fun_length: u16,
    pub num_bytecode_type_sets: u32,
    pub bytecode: Vec<u8>,
    pub scope_notes: Vec<ScopeNote>,
    // TODO: Add resume_offsets and try_notes.
}

/// Index into ImmutableScriptDataList.scripts.
#[derive(Debug, Clone, Copy)]
pub struct ImmutableScriptDataIndex {
    index: usize,
}

impl ImmutableScriptDataIndex {
    fn new(index: usize) -> Self {
        Self { index }
    }
}

impl From<ImmutableScriptDataIndex> for usize {
    fn from(index: ImmutableScriptDataIndex) -> usize {
        index.index
    }
}

/// List of ImmutableScriptData.
#[derive(Debug)]
pub struct ImmutableScriptDataList {
    /// Uses Option to allow `allocate()` and `populate()` to be called
    /// separately.
    items: Vec<Option<ImmutableScriptData>>,
}

impl ImmutableScriptDataList {
    pub fn new() -> Self {
        Self { items: Vec::new() }
    }

    pub fn push(&mut self, script: ImmutableScriptData) -> ImmutableScriptDataIndex {
        let index = self.items.len();
        self.items.push(Some(script));
        ImmutableScriptDataIndex::new(index)
    }

    pub fn allocate(&mut self) -> ImmutableScriptDataIndex {
        let index = self.items.len();
        self.items.push(None);
        ImmutableScriptDataIndex::new(index)
    }

    pub fn populate(&mut self, index: ImmutableScriptDataIndex, script: ImmutableScriptData) {
        self.items[usize::from(index)].replace(script);
    }
}

impl From<ImmutableScriptDataList> for Vec<ImmutableScriptData> {
    fn from(list: ImmutableScriptDataList) -> Vec<ImmutableScriptData> {
        list.items
            .into_iter()
            .map(|g| g.expect("Should be populated"))
            .collect()
    }
}

#[derive(Debug)]
pub struct SourceExtent {
    pub source_start: u32,
    pub source_end: u32,
    pub to_string_start: u32,
    pub to_string_end: u32,

    pub lineno: u32,
    pub column: u32,
}

impl SourceExtent {
    pub fn top_level_script(lineno: u32, column: u32) -> Self {
        Self {
            source_start: 0,
            source_end: 0,
            to_string_start: 0,
            to_string_end: 0,

            lineno,
            column,
        }
    }
}

/// Maps to js::frontend::ScriptStencil in m-c/js/src/frontend/Stencil.h.
#[derive(Debug)]
pub struct ScriptStencil {
    pub immutable_flags: ImmutableScriptFlags,

    /// For top level script and non-lazy function script,
    /// this is a list of GC things referred by bytecode and scope.
    ///
    /// For lazy function script, this is a list of inner functions and
    /// closed over bindings.
    pub gcthings: Vec<GCThing>,

    pub immutable_script_data: Option<ImmutableScriptDataIndex>,

    pub extent: SourceExtent,

    pub fun_name: Option<SourceAtomSetIndex>,
    pub fun_nargs: u16,
    pub fun_flags: FunctionFlags,

    pub lazy_function_enclosing_scope_index: Option<ScopeIndex>,
}

impl ScriptStencil {
    pub fn top_level_script(
        gcthings: Vec<GCThing>,
        immutable_script_data: ImmutableScriptDataIndex,
        extent: SourceExtent,
    ) -> Self {
        Self {
            immutable_flags: ImmutableScriptFlags::new(),
            gcthings,
            immutable_script_data: Some(immutable_script_data),
            extent,
            fun_name: None,
            fun_nargs: 0,
            fun_flags: FunctionFlags::empty(),
            lazy_function_enclosing_scope_index: None,
        }
    }

    pub fn lazy_function(
        extent: SourceExtent,
        fun_name: Option<SourceAtomSetIndex>,
        is_generator: bool,
        is_async: bool,
        fun_flags: FunctionFlags,
        lazy_function_enclosing_scope_index: ScopeIndex,
    ) -> Self {
        let mut flags = ImmutableScriptFlagsEnum::IsFunction as u32;
        if is_generator {
            flags |= ImmutableScriptFlagsEnum::IsGenerator as u32;
        }
        if is_async {
            flags |= ImmutableScriptFlagsEnum::IsAsync as u32;
        }

        Self {
            immutable_flags: ImmutableScriptFlags::from_raw(flags),
            gcthings: Vec::new(),
            immutable_script_data: None,
            extent,
            fun_name,
            fun_nargs: 0,
            fun_flags,
            lazy_function_enclosing_scope_index: Some(lazy_function_enclosing_scope_index),
        }
    }

    pub fn is_function(&self) -> bool {
        self.immutable_flags
            .has(ImmutableScriptFlagsEnum::IsFunction)
    }

    pub fn is_non_lazy_function(&self) -> bool {
        self.is_function() && self.immutable_script_data.is_some()
    }

    pub fn is_lazy_function(&self) -> bool {
        self.is_function() && self.immutable_script_data.is_none()
    }

    pub fn set_function_has_this_binding(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::FunctionHasThisBinding);
    }

    pub fn set_has_rest(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags.set(ImmutableScriptFlagsEnum::HasRest);
    }

    pub fn set_needs_function_environment_objects(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::NeedsFunctionEnvironmentObjects);
    }

    pub fn set_function_has_extra_body_var_scope(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::FunctionHasExtraBodyVarScope);
    }

    pub fn set_should_declare_arguments(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::ShouldDeclareArguments);
    }

    pub fn set_arguments_has_var_binding(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::ArgumentsHasVarBinding);
    }

    pub fn set_always_needs_args_obj(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::AlwaysNeedsArgsObj);
    }

    pub fn set_has_mapped_args_obj(&mut self) {
        debug_assert!(self.is_lazy_function());
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::HasMappedArgsObj);
    }

    pub fn is_arrow_function(&self) -> bool {
        self.is_function() && self.fun_flags.is_arrow()
    }

    pub fn set_fun_name(&mut self, name: SourceAtomSetIndex) {
        debug_assert!(self.is_function());
        self.fun_name = Some(name);
    }

    pub fn fun_name<'a>(&'a self) -> &'a Option<SourceAtomSetIndex> {
        debug_assert!(self.is_function());
        &self.fun_name
    }

    pub fn add_fun_nargs(&mut self) {
        debug_assert!(self.is_function());
        self.fun_nargs += 1;
    }

    pub fn set_to_string_starts(&mut self, to_string_start: usize) {
        self.extent.to_string_start = to_string_start as u32;
    }

    pub fn set_to_string_end(&mut self, to_string_end: usize) {
        self.extent.to_string_end = to_string_end as u32;
    }

    pub fn set_source_end(&mut self, source_end: usize) {
        self.extent.source_end = source_end as u32;
    }

    pub fn push_inner_function(&mut self, fun: ScriptStencilIndex) {
        self.immutable_flags
            .set(ImmutableScriptFlagsEnum::HasInnerFunctions);
        self.gcthings.push(GCThing::Function(fun));
    }

    pub fn push_closed_over_bindings(&mut self, name: SourceAtomSetIndex) {
        debug_assert!(self.is_lazy_function());
        self.gcthings.push(GCThing::Atom(name));
    }
}

/// Index into ScriptStencilList.scripts.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ScriptStencilIndex {
    index: usize,
}

impl ScriptStencilIndex {
    fn new(index: usize) -> Self {
        Self { index }
    }
}

impl From<ScriptStencilIndex> for usize {
    fn from(index: ScriptStencilIndex) -> usize {
        index.index
    }
}

/// List of stencil scripts.
#[derive(Debug)]
pub struct ScriptStencilList {
    scripts: Vec<ScriptStencil>,
}

impl ScriptStencilList {
    pub fn new() -> Self {
        Self {
            scripts: Vec::new(),
        }
    }

    pub fn push(&mut self, script: ScriptStencil) -> ScriptStencilIndex {
        let index = self.scripts.len();
        self.scripts.push(script);
        ScriptStencilIndex::new(index)
    }

    pub fn get<'a>(&'a self, index: ScriptStencilIndex) -> &'a ScriptStencil {
        &self.scripts[usize::from(index)]
    }

    pub fn get_mut<'a>(&'a mut self, index: ScriptStencilIndex) -> &'a mut ScriptStencil {
        &mut self.scripts[usize::from(index)]
    }
}

impl From<ScriptStencilList> for Vec<ScriptStencil> {
    fn from(list: ScriptStencilList) -> Vec<ScriptStencil> {
        list.scripts.into_iter().collect()
    }
}
