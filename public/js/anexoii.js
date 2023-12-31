
const csrfToken = document.head.querySelector("[name~=csrf-token][content]").content;

    $(document).ready(function(){
        // Ventana modal
        var modal = document.getElementById("ventanaModal");
        var modal1 = document.getElementById("ventanaModal1");


        document.getElementById("abrirModal").addEventListener("click",function() {
            modal.style.display = "block";
        });

        document.getElementsByClassName("cerrar")[0].addEventListener("click",function() {
            modal.style.display = "none";
        });

        window.addEventListener("click",function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

        document.getElementById("abrirFiltro").addEventListener("click",function() {
            modal1.style.display = "block";
        });

        document.getElementsByClassName("cerrar")[1].addEventListener("click",function() {
            modal1.style.display = "none";
        });

        window.addEventListener("click",function(event) {
            if (event.target == modal1) {
                modal1.style.display = "none";
            }
        });

        cargarReloj();

        document.getElementById('fecha').addEventListener('change',(e)=>{
            let fecha = new Date(e.target.value)
            fecha.setTime(fecha.getTime() + fecha.getTimezoneOffset() * 60 * 1000);
            let hoy = new Date()
            hoy.setHours(0,0,0,0);
            if( fecha.getTime() != hoy.getTime() ){
                $('#abrirModal').hide()
            }else{
                $('#abrirModal').show()
            }
            crearTabla()
            

        })

        $('#larin').select2({
            dropdownAutoWidth : true,
            width: '400px',
            placeholder: 'Selecciona una opción',
            language: "es"
        })

        $('#larin').on('select2:select', function (e) {
            var prueba = e.params.data;
            Pclave = prueba.id
            fetch('/anexoii/getLarin',{
                method : 'POST',
                body: JSON.stringify({
                    id_larin : Pclave
                    }),
                headers:{
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": csrfToken
                }
            }).then(response=>{
                return response.json()
            }).then( respuesta=>{
                document.getElementById('descripcion').value=respuesta[0].larin
            }).catch(error => console.error(error));
        });

        let lineas = ['1','2','3','4','5','6','7','8','9','12','A','B'];
        lineas.forEach(element => {
            
            if(element=='A' || element =='B'){
                generaTabla('#linea'+element,'L'+element)
            }else if(element == '12'){
                generaTabla('#linea'+element,element)
            }else{
                generaTabla('#linea'+element,'0'+element)
            }
        });
        
        document.getElementById('borrarFiltro').addEventListener('click',(e)=>{
            crearTabla()
            modal1.style.display = "none";
        })

        document.getElementById('aplicarFiltro').addEventListener('click',(e)=>{
            let lineas = ['1','2','3','4','5','6','7','8','9','12','A','B'];
            let filtro = $('#filtros').val()
            let filtros = []
            filtro.forEach(element => {
                filtros.push(element)
            })
            lineas.forEach(element => {
                $('#linea'+element).DataTable().destroy()
                if(element=='A' || element =='B'){
                    generaTabla2('#linea'+element,'L'+element,filtros)
                }else if(element == '12'){
                    generaTabla2('#linea'+element,element,filtros)
                }else{
                    generaTabla2('#linea'+element,'0'+element,filtros)
                }
            });
            modal1.style.display = "none";
        })

        

        document.getElementById('submit').addEventListener('click',(e)=>{
            e.preventDefault()
            let resultado = validar();
            
            if(!resultado){                
                compruebaRep()
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Revisa los campos',
                    text: 'Revisa que todos los campos sean correctos'
                })
            }
        })

        actualizarTabla()

    })

    function actualizarTabla(){
        let lineas = ['1','2','3','4','5','6','7','8','9','12','A','B'];
        
            lineas.forEach(element => {
                $('#linea'+element).DataTable().ajax.reload();
        });

        setTimeout(actualizarTabla,2000)
        
    }

    function validar(){
        let error = false;

        let inputsrequeridos = document.querySelectorAll('#form-evento [required]')  
        for(let i=0;i<inputsrequeridos.length;i++){
            if(inputsrequeridos[i].value =='' ){
                inputsrequeridos[i].style.borderColor = '#FF0400'
                error = true
            }else{
                inputsrequeridos[i].style.removeProperty('border');
            }
        }

        return error;
    }

    function compruebaRep(){
        let Pfecha = document.getElementById('fecha_f').value
        let Phora = document.getElementById('hora_l').value
        let Plinea = document.getElementById('linea').value
        let Plarin = document.getElementById('larin').value

        
        fetch('/anexoii/getReporte/',{
            method : 'POST',
            body: JSON.stringify({
                fecha : Pfecha,
                hora  : Phora,
                linea : Plinea,
                larin : Plarin,       
            }),
            headers:{
                'Content-Type': 'application/json',
                "X-CSRF-Token": csrfToken
            }
        }).then(response=>{
            return response.json()
        }).then( data=>{      
            if(data[0]){            
                Swal.fire(
                    {icon: 'error',
                    title: 'Se intenta guardar un reporte existente',
                    text: data[0].id}
                )
                console.log(data[0].id);
            }else{
                guardar();
            }
        }).catch(error => console.error(error));
    }

    function generaTabla(linea,idLinea){
        new DataTable(linea, {
            responsive: true,
            autoWidth: false,
            language: {
                infoEmpty: 'No se han registrado Incidentes Relevantes durante el día',
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-MX.json',
            },
            ajax : {
                method : "POST",
                url : "/anexoii/getLinea",
                headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')},
                data : { 
                    fecha : document.getElementById('fecha').value,
                    linea : idLinea,
                },
            },
            columns: [
                { data: 'hora' },
                { data: 'descripcion' },
                {
                    "data": null,
                    "bSortable": false,
                    "mRender": function(data, type, value) {
                        return '<a href="/anexoii/'+value["id"]+'" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i>Editar</a> <a href="/anexoii/delete/'+value["id"]+'" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i>Eliminar</a>'
                    }
                },
            ],
            paging: false,
            searching: false,
            ordering:  false,
            info: false,
            processing: true,
            serverSide: true,
            
        });

    }

    function generaTabla2(linea,idLinea,filtros){

        new DataTable(linea, {
            responsive: true,
            autoWidth: false,
            language: {
                infoEmpty: 'No se han registrado Incidentes Relevantes durante el día',
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-MX.json',
            },
            ajax : {
                method : "POST",
                url : "/anexoii/getLineaF",
                headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')},
                data : { 
                    fecha : document.getElementById('fecha').value,
                    linea : idLinea,
                    desc1 : filtros[0],
                    desc2 : filtros[1],
                    desc3 : filtros[2],
                    desc4 : filtros[3],
                    desc5 : filtros[4],
                    desc6 : filtros[5],
                    desc7 : filtros[6],
                    desc8 : filtros[7],
                },
            },
            columns: [
                { data: 'hora' },
                { data: 'descripcion' },
            ],
            paging: false,
            searching: false,
            ordering:  false,
            info: false,
            processing: true,
            serverSide: true    
        });

    }

    function cargarReloj(){
        let hoy = new Date()
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const dias_semana = ['Domingo', 'Lunes', 'martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        let fecha = dias_semana[hoy.getDay()] + ', ' + hoy.getDate() + ' de ' + meses[hoy.getMonth()] + ' de ' + hoy.getUTCFullYear()
        document.getElementById('fechaHoy').innerHTML = fecha + ', '+hoy.toLocaleTimeString('en-US')
        setTimeout(cargarReloj, 500);
    }


    function guardar(){
        let Pfecha   = document.getElementById('fecha_f').value
        let Plinea   = document.getElementById('linea').value
        let Phora    = document.getElementById('hora_l').value
        let Plarin   = document.getElementById('larin').value
        let Pdescripcion = document.getElementById('descripcion').value     
        let Pusuario = document.getElementById('usuario').value
        fetch('/anexoii/',{
                method : 'POST',
                body: JSON.stringify({
                    fecha   : Pfecha,  
                    linea   : Plinea,  
                    hora    : Phora,   
                    larin   : Plarin,
                    descripcion : Pdescripcion,  
                    usuario : Pusuario,
                }),
                headers:{
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": csrfToken
                }
            }).then(response=>{
                return response.json()
            }).then( data=>{
                if(data.success){
                    Swal.fire(
                        {icon: 'success',
                        title: 'Reporte guardado con éxito',
                        text: data.id}
                    )
                    limpiar() 
                }
                console.log(data);
            }).catch(error => console.error(error));

        return true

    }


    function limpiar(){
        document.getElementById('linea').value = "" 
        document.getElementById('hora_l').value = ""
        document.getElementById('descripcion').value = ""
        document.getElementById('larin').value = '0'
        $('#larin').trigger('change');
        crearTabla()
    }

    function crearTabla(){
        let lineas = ['1','2','3','4','5','6','7','8','9','12','A','B'];
        
            lineas.forEach(element => {
                $('#linea'+element).DataTable().destroy()
                if(element=='A' || element =='B'){
                    generaTabla('#linea'+element,'L'+element)
                }else if(element == '12'){
                    generaTabla('#linea'+element,element)
                }else{
                    generaTabla('#linea'+element,'0'+element)
                }
            });
    }