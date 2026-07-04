use std::fmt::Display;
use std::io::Cursor;

use source2_demo::{
    Context, DemoRunner, Entity, EntityField, FieldValue, Interests, Observer, ObserverResult,
    Parser,
};
use wasm_bindgen::{prelude::wasm_bindgen, JsError};

#[wasm_bindgen]
pub struct WrappedParser {
    parser: Parser<'static, source2_demo::reader::SeekableReader<Cursor<Vec<u8>>>>,
}

#[wasm_bindgen(getter_with_clone)]
pub struct EntityLi {
    pub index: i32,
    pub name: String,
}

#[wasm_bindgen(getter_with_clone)]
pub struct EntityFieldLi {
    pub path: Vec<u8>,
    #[wasm_bindgen(js_name = "namedPath")]
    pub named_path: Vec<String>,
    pub value: String,
    #[wasm_bindgen(js_name = "encodedAs")]
    pub encoded_as: String,
    #[wasm_bindgen(js_name = "decodedAs")]
    pub decoded_as: String,
}

#[wasm_bindgen(getter_with_clone)]
pub struct StringTableLi {
    pub name: String,
}

#[wasm_bindgen(getter_with_clone)]
pub struct StringTableItemLi {
    pub string: Option<Vec<u8>>,
    #[wasm_bindgen(js_name = "userData")]
    pub user_data: Option<Vec<u8>>,
}

#[derive(Default)]
struct InspectorState;

impl Observer for InspectorState {
    fn interests(&self) -> Interests {
        Interests::ENTITY_STATE | Interests::STRING_TABLE_STATE | Interests::STRING_TABLE_ENTRIES
    }

    fn on_tick_start(&mut self, _ctx: &Context) -> ObserverResult {
        Ok(())
    }
}

#[wasm_bindgen]
impl WrappedParser {
    #[wasm_bindgen(constructor, js_name = "fromBytes")]
    pub fn from_bytes(bytes: Vec<u8>) -> Result<WrappedParser, JsError> {
        let cursor = Cursor::new(bytes);
        let mut parser = Parser::from_reader(cursor).map_err(to_js_error)?;
        parser.register_observer::<InspectorState>();
        Ok(Self { parser })
    }

    #[wasm_bindgen(js_name = "tick")]
    pub fn tick(&self) -> i32 {
        self.parser.context().tick() as i32
    }

    #[wasm_bindgen(js_name = "totalTicks")]
    pub fn total_ticks(&self) -> i32 {
        self.parser.replay_info().playback_ticks()
    }

    #[wasm_bindgen(js_name = "runToTick")]
    pub fn run_to_tick(&mut self, tick: i32) -> Result<(), JsError> {
        let target_tick = tick.max(0) as u32;
        let current_tick = self.parser.context().tick();

        if target_tick == current_tick {
            return Ok(());
        }

        if target_tick.saturating_add(1) == current_tick {
            let previous_tick = self.parser.context().previous_tick();
            if previous_tick != u32::MAX && previous_tick < current_tick {
                return self.parser.jump_to_tick(previous_tick).map_err(to_js_error);
            }

            return Ok(());
        }

        self.parser.jump_to_tick(target_tick).map_err(to_js_error)
    }

    #[wasm_bindgen(js_name = "listEntities")]
    pub fn list_entities(&self) -> Vec<EntityLi> {
        self.parser
            .context()
            .entities()
            .iter()
            .map(entity_li)
            .collect()
    }

    #[wasm_bindgen(js_name = "listBaselineEntities")]
    pub fn list_baseline_entities(&self) -> Vec<EntityLi> {
        self.parser
            .context()
            .baseline_entities()
            .into_iter()
            .map(|entity| EntityLi {
                index: entity.class_id,
                name: entity.class_name,
            })
            .collect()
    }

    #[wasm_bindgen(js_name = "listEntityFields")]
    pub fn list_entity_fields(&self, entity_index: i32) -> Option<Vec<EntityFieldLi>> {
        self.parser
            .context()
            .entities()
            .get_by_index(entity_index as usize)
            .ok()
            .map(|entity| collect_entity_field_list(entity.fields()))
    }

    #[wasm_bindgen(js_name = "listBaselineEntityFields")]
    pub fn list_baseline_entity_fields(&self, entity_index: i32) -> Option<Vec<EntityFieldLi>> {
        self.parser
            .context()
            .baseline_fields(entity_index)
            .map(collect_entity_field_list)
    }

    #[wasm_bindgen(js_name = "listStringTables")]
    pub fn list_string_tables(&self) -> Vec<StringTableLi> {
        self.parser
            .context()
            .string_tables()
            .iter()
            .map(|string_table| StringTableLi {
                name: string_table.name().to_string(),
            })
            .collect()
    }

    #[wasm_bindgen(js_name = "listStringTableItems")]
    pub fn list_string_table_items(
        &self,
        string_table_name: String,
    ) -> Option<Vec<StringTableItemLi>> {
        self.parser
            .context()
            .string_tables()
            .get_by_name(&string_table_name)
            .ok()
            .map(|string_table| {
                string_table
                    .iter()
                    .map(|row| StringTableItemLi {
                        string: Some(row.key().as_bytes().to_vec()),
                        user_data: row.value().map(|value| value.to_vec()),
                    })
                    .collect()
            })
    }
}

fn entity_li(entity: &Entity) -> EntityLi {
    EntityLi {
        index: entity.index() as i32,
        name: entity.class().name().to_string(),
    }
}

fn collect_entity_field_list(fields: Vec<EntityField<'_>>) -> Vec<EntityFieldLi> {
    fields
        .into_iter()
        .map(|field| EntityFieldLi {
            path: field
                .path
                .into_iter()
                .map(|part| u8::try_from(part).unwrap_or(u8::MAX))
                .collect(),
            named_path: field.name.split('.').map(ToString::to_string).collect(),
            value: field.value.map(format_field_value).unwrap_or_default(),
            encoded_as: field.field_type,
            decoded_as: field.decoded_type.unwrap_or("None").to_string(),
        })
        .collect()
}

fn format_field_value(value: &FieldValue) -> String {
    match value {
        FieldValue::String(value) => value.clone(),
        other => other.to_string(),
    }
}

fn to_js_error(error: impl Display) -> JsError {
    JsError::new(&error.to_string())
}

#[wasm_bindgen(js_name = "isEHandleValid")]
pub fn is_ehandle_valid(handle: u32) -> bool {
    handle != u32::MAX && handle != 0x00ff_ffff
}

#[wasm_bindgen(js_name = "eHandleToIndex")]
pub fn ehandle_to_index(handle: u32) -> i32 {
    (handle & 0x3fff) as i32
}
