export type Strings = {
  languages: {
    en_US: string;
  };
  actions: {
    disable: string;
    enable: string;
    edit: string;
    delete: string;
    export_download: string;
    render: string;
    no: string;
    yes: string;
    save_and_exit: string;
    exit_without_saving: string;
    download: string;
  };
  generic: {
    app_title: string;
    camera: string;
    useMouseOrTouch: string;
    pose: string;
    expression: string;
    render: string;
    resolution_width: string;
    resolution_height: string;
    camera_field_of_view: string;
  };
  alert: {
    audio_requires_action: {
      title: string;
      description: string;
    };
    delete_confirmation: {
      title: string;
      description: string;
    };
    choice: string;
  };
  pages: {
    mainMenu: {
      title: string;
    };
    library: {
      title: string;
      options: string;
      credits: {
        title: string;
        view: string;
        // general credits
        datkat21: string;
        ariankordi: string;
        objecty: string;
        // The localization author name credits are hardcoded into the app and use the language names specified at the top.
        localization: string;
        general: string;
        translators: string;
      };

      export: {
        // this title is reused for export/download and render options
        title: string;
        description: string;
        // for context, only string downloads a file here
        get_ffsd_hex: string;
        get_ffsd_b64: string;
        save_ffsd_file: string;
        save_miic_file: string;
        get_mii_studio_data: string;
        ffsd_modal: string;
        mii_studio_data_modal: string;
        // begin render choices
        generate_qr: string;
        render_image: string;
        render_headshot: string;
        render_full_body: string;
        render_head_only: string;
        // subject to change
        custom_render: string;
      };
      custom_render: {
        title: string;
        head: string;
        full_body: string;
        // You don't have to translate these as they are temporary!
        pose_unfinished_warning: string;
        render_unfinished_warning: string;
        idle: string;
        pose: string;
      };
    };
    editor: {
      choice: {
        color: string;
        favorite: string;
        gender: string;
        goatee: string;
        hat_color: string;
        hat: string;
        mustache: string;
        normal: string;
        position: string;
        special: string;
        type: string;
      };
      quit: {
        title: string;
        description_no_changes: string;
        description_changes_made: string;
      };
      warning_custom: `%custom% is a CUSTOM property, and will not transfer to any other data formats.
It is purely visual and provided for the ability to use in renders.`;
    };
    saveData: {
      title: string;
      import: string;
      export: string;
    };
    settings: {
      title: string;
      // Settings
      settings_bgm: string;
      settings_sfx: string;
    };
  };
};
